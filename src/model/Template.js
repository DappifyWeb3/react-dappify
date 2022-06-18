import Moralis from 'moralis';
import isEmpty from 'lodash/isEmpty';
import { getPreference } from '../utils/localStorage';
import constants from '../constants';
import { forEach } from 'lodash';

export default class Template {

    id;
    name;
    schema;
    supportedChains;
    source;

    constructor(template) {
        this.name = template.get('name');
        this.schema = template.get('schema');
        this.createdAt = template.get('createdAt');
        this.updatedAt = template.get('updatedAt');
        this.supportedChains = template.get('supportedChains');
        this.source = template;
        return this;
    }

    static listTemplates = async({ filters = [] }) => {
        const query = new Moralis.Query('Template');

        filters.forEach((filter) => {
            switch (filter?.type) {
                case 'equalTo':
                    query.equalTo(filter.key, filter.value);
                    break;
                case 'fullText':
                    query.fullText(filter.key, filter.value);
                    break;
                case 'contains':
                    query.contains(filter.key, filter.value);
                    break;
                default:
                    query.equalTo(filter.key, filter.value);
            }
        });

        const response = await query.find() || {};
        const templates = response.map((tmp) => new Template(tmp));
        return templates;
    }

    static current = () => {
        const template = process.env.REACT_APP_TEMPLATE_NAME;
        const configuration = getPreference(constants.PREFERENCES.SUBDOMAIN)?.config;
        return !isEmpty(configuration?.template) ? configuration.template[template] : {}
    }
}
