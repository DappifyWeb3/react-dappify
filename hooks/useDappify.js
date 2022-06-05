import { useState, useEffect } from 'react';
import { useMoralis } from 'react-moralis';
import { loadConfiguration  } from 'react-dappify/configuration';
import defaultConfiguration from 'react-dappify/configuration/default.json';
import Project from 'react-dappify/model/Project';
import UserProfile from 'react-dappify/model/UserProfile';
import { getProviderPreference, setProviderPreference } from 'react-dappify/utils/localStorage';
import { Logger } from 'react-dappify/utils/log';
import isEmpty from 'lodash/isEmpty';

const useDappify = () => {
    const { authenticate: providerAuthenticate, logout, user, isAuthenticated, Moralis, provider } = useMoralis();
    const [configuration, setConfiguration] = useState(defaultConfiguration);
    const [nativeBalance, setNativeBalance] = useState();
    const [isRightNetwork, setRightNetwork] = useState(false);
    const [project, setProject] = useState();
    const Provider = Moralis;

    useEffect(() => {
      const bootstrapProject = async () => {
        const currentProject = await Project.getInstance();
        setProject(currentProject);
        setConfiguration(currentProject.config);
        Moralis.onChainChanged((chain) => {
          onChainChange(chain);
        });
        Moralis.onConnect((provider) => {
          console.log(provider);
        });
        Moralis.onAccountChanged((account) => {
          console.log(account);
        });
        Moralis.onDisconnect((error) => {
          console.log(error);
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

    useEffect(() => {
        if (isEmpty(user)) return;
        const loadBalances = async () => {
          const balance = await Moralis.Web3API.account.getNativeBalance({
            chain: configuration.chainId,
            address: user.get('ethAddress')
          });
          const currBalance = parseFloat(Moralis.Units.FromWei(balance.balance)).toFixed(4);
          setNativeBalance(currBalance);
        }
        loadBalances();
    }, [user, configuration]);

    const onChainChange = (chainId) => {
      if (isEmpty(chainId)) return;
      const targetNetwork = configuration?.chainId;
      const isRight = chainId && chainId === targetNetwork;
      setRightNetwork(isRight);
      console.log(`Switching to ${chainId} isRightNetwork ${isRight}`);
    }
  
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
        getProviderInstance
    };
};

export default useDappify;
