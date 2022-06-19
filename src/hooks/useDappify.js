import { useState, useEffect } from 'react';
import { useMoralis } from 'react-moralis';
import { loadConfiguration  } from '../configuration';
import defaultConfiguration from '../configuration/default.json';
import Project from '../model/Project';
import UserProfile from '../model/UserProfile';
import { getProviderPreference, setProviderPreference } from '../utils/localStorage';
import { Logger } from '../utils/log';
import isEmpty from 'lodash/isEmpty';

const useDappify = () => {
    const { authenticate: providerAuthenticate, logout, user, isAuthenticated, Moralis, provider } = useMoralis();
    const [configuration, setConfiguration] = useState(defaultConfiguration);
    const [nativeBalance, setNativeBalance] = useState();
    const [isRightNetwork, setRightNetwork] = useState(false);
    const [currentChain, setCurrentChain] = useState();
    const [project, setProject] = useState();
    const Provider = Moralis;

    useEffect(() => {
      if (isAuthenticated) {
        setRightNetwork(currentChain === parseInt(configuration.chainId));
      }
    }, [configuration, currentChain, isAuthenticated]);

    useEffect(() => {
      const bootstrapProject = async () => {
        const currentProject = await Project.getInstance();
        setProject(currentProject);
        setConfiguration(currentProject.config);
        Moralis.onChainChanged((chain) => {
          getProviderInstance();
        });
        Moralis.onConnect((provider) => {
          getProviderInstance();
        });
        Moralis.onAccountChanged((account) => {
        });
        Moralis.onDisconnect((error) => {
        });
      };

      bootstrapProject();
    }, [Moralis, isAuthenticated]);

    useEffect(() => {
        loadConfiguration(configuration);
    },[configuration]);

    useEffect(() => {
        verifyNetwork();
    }, [provider]);

    const loadBalances = async () => {
      const balance = await Moralis.Web3API.account.getNativeBalance({
        chain: configuration.chainId,
        address: user.get('ethAddress')
      });
      const currBalance = parseFloat(Moralis.Units.FromWei(balance.balance)).toFixed(4);
      setNativeBalance(currBalance);
      getProviderInstance();
    }

    useEffect(() => {
        if (isEmpty(user)) return;
        loadBalances();
    }, [user, configuration]);

    const verifyNetwork = async() => {
        if (isEmpty(user)) return;
        if (isEmpty(provider)) return;
        await switchToChain(configuration, provider.provider);
    }

    const switchToChain = async(network, currentProvider) => {
      if (isRightNetwork) return;
      if (!network) return;
      const chainId = network.chainId;
      if (!chainId) return;
      try {
        await Moralis.switchNetwork(chainId);
      } catch (error) {
        if (error.code === 4902) {
          try {
            await currentProvider.request({
              method: "wallet_addEthereumChain",
              params: [network]
            });
          } catch (error) {
            throw new Error("Could not change network");
          }
        }
      }
    }

    const authenticate = async(params) => {
      let providerUser;
      try {
        setProviderPreference(params);
        const pref = await getProviderPreference();
        Logger.debug(`Authentication method`);
        Logger.debug(pref);
        const principal = configuration?.name || 'Dappify';
        pref.signingMessage = `${principal} wants to connect!`;
        providerUser = await providerAuthenticate(pref);
        if (providerUser) {
          await UserProfile.init(providerUser);
        }
      } catch (e) {
        Logger.error(e);
      }
      return providerUser;
    }

    const getProviderInstance = async() => {
      let web3;
      try {
        const pref = getProviderPreference();
        const principal = configuration?.name || 'Dappify';
        pref.signingMessage = `${principal} wants to connect!`;
        web3 = await Moralis.enableWeb3(pref);
        const net = await web3?.getNetwork();
        const chainId = net?.chainId;
        setCurrentChain(chainId);
      } catch(e) {
        Logger.error(e);
        console.log(e);
      }
      return web3;
    }

    return {
        configuration,
        authenticate,
        isAuthenticated,
        user,
        logout,
        Provider,
        nativeBalance,
        verifyNetwork,
        isRightNetwork,
        project,
        provider,
        switchToChain,
        getProviderInstance,
        currentChain,
        loadBalances
    };
};

export default useDappify;
