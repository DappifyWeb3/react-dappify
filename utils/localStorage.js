import constants from 'react-dappify/constants';
import CoinbaseConnector from 'react-dappify/connectors/CoinbaseConnector';
import isEmpty from 'lodash/isEmpty';
import { Logger } from 'react-dappify/utils/log';

export const getProviderPreference = () => {
    const authParams = getPreference(constants.PREFERENCES.PROVIDER);
    if (authParams && authParams.connector) {
        // Change from class to string for ref
        Logger.debug(`Getting provider preferences ${authParams.connector} for ${CoinbaseConnector.name}`);
        Logger.debug(authParams.connector === CoinbaseConnector.name);
        authParams.connector = authParams.connector === CoinbaseConnector.name ? CoinbaseConnector : authParams.connector;
    } else {
        Logger.debug(`Not a connector`);
    }
    Logger.debug(`Current preference`);
    Logger.debug(authParams);
    return authParams;
}

export const setProviderPreference = (authParams = {}) => {
    Logger.debug(`Setting provider preferences`);
    Logger.debug(authParams);
    if (authParams && authParams.connector && authParams.connector instanceof Function) {
        // Change from class to string for ref
        authParams.connector = authParams.connector.name;
    }
    setPreference(constants.PREFERENCES.PROVIDER, authParams);
    return;
}

export const setPreference = (key, value) => {
    if (isEmpty(key)) return;
    const valueStr = JSON.stringify(value);
    Logger.debug(`Caching key ${key} value ${valueStr}`);
    localStorage.setItem(key, valueStr);
    return getPreference(key);
}

export const getPreference = (key) => {
    if (isEmpty(key)) return null;
    const localItem = localStorage.getItem(key);
    if (isEmpty(localItem)) return null;
    let value;
    try {
        Logger.debug(`Getting cached ${key}`);
        value = JSON.parse(localItem);
    } catch (e) {
        Logger.debug(`Failed to parse ${localItem} with error ${e.message}`);
    }
    return value;
}