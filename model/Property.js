import isEmpty from 'lodash/isEmpty';
import { getPreference } from 'react-dappify/utils/localStorage';
import constants from 'react-dappify/constants';

export default class Property {

    key;
    value;
    type;

    constructor(property = {}) {
        if (isEmpty(property)) {
            return this;   
        }
        this.key = property.key;
        this.value = property.value;
        this.type = property.type;
        return this;
    }

    static find = ({ key, type }) => {
        const template = process.env.REACT_APP_TEMPLATE_NAME;
        const configuration = getPreference(constants.PREFERENCES.SUBDOMAIN)?.config;
        const props = configuration && configuration.template[template] && configuration.template[template].properties ? configuration.template[template].properties : [];
        const foundProp = props.find((prop) => prop.key === key && prop.type === type);
        return foundProp ? new Property(foundProp) : null;
    }

    static findAllWithType = ({ type }) => {
        const template = process.env.REACT_APP_TEMPLATE_NAME;
        const configuration = getPreference(constants.PREFERENCES.SUBDOMAIN)?.config;
        const props = configuration && configuration.template[template] && configuration.template[template].properties ? configuration.template[template].properties : [];
        const foundProps = props.filter((prop) => prop.type === type);
        return foundProps.map((prop) => new Property(prop));
    }
}
