import { parse } from 'tldts';
import Moralis from 'moralis';
import UserProfile from 'react-dappify/model/UserProfile';
import { getPreference, setPreference } from 'react-dappify/utils/localStorage';
import isEmpty from 'lodash/isEmpty';
import { Logger } from 'react-dappify/utils/log';
import moment from 'moment';
import axios from 'axios';
import constants from 'react-dappify/constants';

export default class Project {

    static PLATFORM_DOMAIN = 'dappify';
    static instance;

    id;
    config;
    source;
    createdAt;
    updatedAt;

    static getInstance = async () => {
        if (Project.instance) return Project.instance;
        return await Project.load();
    }

    static load = async() => {
        const rawUrl =  window.location.hostname;
        Logger.debug(`Raw url ${rawUrl}`);
        let sanitizedUrl = rawUrl.replace('staging.','').replace('dev.','');
        // Is explicit template defined, remove as well e.g. template.subdomain.<env_removed>.dappify.com
        const uriComponents = sanitizedUrl.split('.');
        if (uriComponents.length === 4) {
            sanitizedUrl = sanitizedUrl.replace(`${process.env.REACT_APP_TEMPLATE_NAME}.`,'');
        }
        Logger.debug(`Sanitized url ${sanitizedUrl}`);
        const domainName = parse(sanitizedUrl);
        const isDappifySubdomain = domainName.domainWithoutSuffix.toLocaleLowerCase() === Project.PLATFORM_DOMAIN;
        const searchKey = isDappifySubdomain ? 'subdomain' : 'domain';
        const searchValue = isDappifySubdomain ? domainName.subdomain ? domainName.subdomain : 'studio' : domainName.hostname;
        const projectObject = await Project.getCached(searchKey, searchValue);
        const ProjectObj = Moralis.Object.extend('Project');
        const providerProject = new ProjectObj();

        if (isEmpty(projectObject?.objectId)) {
            Logger.debug(`Not found project`);
            return new Project();
        }

        providerProject.id = projectObject.objectId;
        providerProject.isTestEnvironment = false;
        providerProject.set('config', projectObject.config);
        return new Project(providerProject);
    }

    constructor(project = {}) {
        this.id = project?.id;
        this.config = project?.attributes?.config || {};
        this.createdAt = project?.attributes?.createdAt || moment();
        this.updatedAt = project?.attributes?.updatedAt || moment();
        this.source = project;
        return this;
    }

    static getCached = async(searchKey, searchValue) => {
        let cachedStr = getPreference(searchKey);
        // if (!cachedStr) {
            const project = await Project.loadFromProvider(searchKey, searchValue);
            setPreference(searchKey, project);
            cachedStr = getPreference(searchKey);
        // } else {
            // console.log(`Project configuration from cached key ${searchKey}`);
        // }
        return cachedStr;
    }

    static loadFromProvider = async(searchKey, searchValue) => {
        Moralis.start({ appId:process.env.REACT_APP_MORALIS_APP_ID, serverUrl:process.env.REACT_APP_MORALIS_SERVER_URL });
        const query = new Moralis.Query('Project');
        Logger.debug(`Loading project from provider with searchKey ${searchKey} and value ${searchValue}`);
        query.equalTo(searchKey, searchValue);
        const result = await query.first();
        return result;
    }

    static getTokenPrice = async() => {
        const context = await UserProfile.getCurrentUserContext();
        const { currentProject } = context;
        const chainId = currentProject.config.chainId;
        let tokenPrice;
        try {
            tokenPrice = await axios.get(`https://deep-index.moralis.io/api/v2/erc20/${constants.PRICE_REF_ETH_MAINNET[chainId]}/price?chain=eth`, {
                headers: {
                    'X-API-Key': process.env.REACT_APP_MORALIS_API_KEY,
                    accept: 'application/json'
                }
            });
        } catch (e) {
            Logger.error(e);
        }
        return tokenPrice?.data ? tokenPrice.data : {};
    }

    static listAll = async(user) => {
        const query = new Moralis.Query('Project');
        query.equalTo('owner', user);
        query.descending('updatedAt');
        const result = await query.find();
        return result.map((project) => new Project(project));
    }

    static exists = async(subdomain) => {
        const query = new Moralis.Query('Project');
        query.equalTo("subdomain", subdomain.toLocaleLowerCase());
        const result = await query.first();
        return result;
    }

    static create = async(appConfiguration, user) => {
        const Project = Moralis.Object.extend('Project');
        const project = new Project();
        project.set('config', appConfiguration);
        project.set('owner', user);
        project.set('subdomain', appConfiguration.subdomain);
        const createdProject = await project.save();
        appConfiguration.appId = createdProject.id;
        createdProject.set('config', appConfiguration);
        const savedProject = await createdProject.save();
        return savedProject;
    }

    static publishChanges = async(appConfiguration, user) => {
        const project = await Project.findWithId(appConfiguration.appId, user);
        project.set('config', appConfiguration);
        return await project.save();
    }

    static destroy = async(appConfiguration, user) => {
        const project = await Project.findWithId(appConfiguration.appId, user);
        return await project.destroy();
    }

    static findWithId = async(appId, user) => {
        const Project = Moralis.Object.extend('Project');
        const query = new Moralis.Query(Project);
        query.equalTo('objectId', appId);
        query.equalTo('owner', user);
        return await query.first();
    }
}