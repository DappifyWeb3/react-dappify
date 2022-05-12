import { parse } from 'tldts';
import Moralis from 'moralis';
import UserProfile from 'react-dappify/model/UserProfile';
import constants from 'react-dappify/constants';

export default class Project {

    static PLATFORM_DOMAIN = 'dappify';
    static instance;

    id;
    config;
    source;
    isTestEnvironment;
    createdAt;
    updatedAt;

    static getInstance = async () => {
        if (Project.instance) return Project.instance;
        return await Project.load();
    }

    static load = async() => {
        const domainName = parse(window.location.hostname);
        const isDappifySubdomain = domainName.domainWithoutSuffix.toLocaleLowerCase() === Project.PLATFORM_DOMAIN;
        const searchKey = isDappifySubdomain ? 'subdomain' : 'domain';
        const searchValue = isDappifySubdomain ? domainName.subdomain.replace('test.','') : domainName.hostname;
        const projectObject = await Project.getCached(searchKey, searchValue);
        const ProjectObj = Moralis.Object.extend('Project');
        const project = new ProjectObj();
        project.id = projectObject.objectId;
        project.isTestEnvironment = isDappifySubdomain && domainName.subdomain.startsWith('test.');
        project.set('config', projectObject.config);
        const loadedProject = new Project(project);
        return loadedProject;
    }

    constructor(project) {
        return this.#fromProvider(project);
    }

    #fromProvider = (project) => {
        this.id = project.id;
        this.isTestEnvironment = project.isTestEnvironment;
        this.config = project.get('config');
        this.createdAt = project.get('createdAt');
        this.updatedAt = project.get('updatedAt');
        this.source = project;
        return this;
    }

    getNetworkForTemplate = (template) => {
        const env = this.isTestEnvironment ? 'test' : 'main';
        return this.config.template[template][env];
    }

    getNetworkContext = (template) => {
        const network = this.getNetworkForTemplate(template);
        return constants.NETWORKS[network.chainId];
    }

    static getCached = async(searchKey, searchValue) => {
        let cachedStr = localStorage.getItem(searchKey);
        // if (!cachedStr) {
        //     //Add to cache
            const project = await Project.loadFromProvider(searchKey, searchValue);
            localStorage.setItem(searchKey, JSON.stringify(project));
            cachedStr = localStorage.getItem(searchKey);
        // } else {
        //     // console.log(`Project configuration from cached key ${searchKey}`);
        // }
        return JSON.parse(cachedStr)
    }

    static loadFromProvider = async(searchKey, searchValue) => {
        Moralis.start({ appId:process.env.REACT_APP_MORALIS_APP_ID, serverUrl:process.env.REACT_APP_MORALIS_SERVER_URL });
        const query = new Moralis.Query('Project');
        query.equalTo(searchKey, searchValue);
        const result = await query.first();
        return result;
    }

    static getTokenPrice = async() => {
        const context = await UserProfile.getCurrentUserContext();
        const { currentProject } = context;
        const tokenPrice = await Moralis.Cloud.run('getTokenPrice', { address: currentProject.config.tokenContractAddress });
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
        console.log(project);
        return await project.save();
    }

    static destroy = async(appConfiguration, user) => {
        console.log(appConfiguration);
        const project = await Project.findWithId(appConfiguration.appId, user);
        console.log(project);
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