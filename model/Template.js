import Moralis from 'moralis';
import isEmpty from 'lodash/isEmpty';
import { getPreference } from 'react-dappify/utils/localStorage';
import constants from 'react-dappify/constants';

export default class Template {

    id;
    name;
    schema;

    source;

    constructor(template) {
        this.name = template.get('name');
        this.schema = template.get('schema');
        this.createdAt = template.get('createdAt');
        this.updatedAt = template.get('updatedAt');
        this.source = template;
        return this;
    }

    static listTemplates = async() => {
        const query = new Moralis.Query('Template');
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
