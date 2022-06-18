import PropTypes from 'prop-types';
import React, { createContext } from 'react';
import useDappify from './hooks/useDappify';
import { MoralisProvider } from 'react-moralis';

export const DappifyContext = createContext(null);

export const DappifyProvider = ({ children }) => (
    <MoralisProvider  appId={process.env.REACT_APP_MORALIS_APP_ID} serverUrl={process.env.REACT_APP_MORALIS_SERVER_URL}>
        <DappifyContextProvider>
            {children}
        </DappifyContextProvider>
    </MoralisProvider>
);

const DappifyContextProvider = ({ children }) => (
    <DappifyContext.Provider value={{ ...useDappify() }}>
        {children}
    </DappifyContext.Provider>
)

DappifyProvider.propTypes = {
    children: PropTypes.node
};
