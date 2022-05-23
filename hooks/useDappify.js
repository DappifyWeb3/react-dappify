import { useState, useEffect } from 'react';
import { useMoralis } from 'react-moralis';
import { ethers } from 'ethers';
import { loadConfiguration  } from 'react-dappify/configuration';
import defaultConfiguration from 'react-dappify/configuration/default.json';
import Project from 'react-dappify/model/Project';
import UserProfile from 'react-dappify/model/UserProfile';
import { debounce } from 'react-dappify/utils/timer';
import { getProviderPreference, setProviderPreference } from 'react-dappify/utils/localStorage';

const useDappify = ({template}) => {
    const { authenticate: providerAuthenticate, logout, user, isAuthenticated, Moralis } = useMoralis();
    const [configuration, setConfiguration] = useState(defaultConfiguration);
    const [nativeBalance, setNativeBalance] = useState();
    const [provider, setProvider] = useState();
    const [isRightNetwork, setRightNetwork] = useState();
    const [project, setProject] = useState();
    const Provider = Moralis;

    const setupProvider = debounce(async (params) => {
      try {
        const web3 = await Moralis.enableWeb3(params);
        setProvider(web3);
      } catch (e) {
        console.log(e);
      }
      return;
    });

    useEffect(() => {
      const bootstrapProject = async () => {
        const currentProject = await Project.getInstance();
        setProject(currentProject);
        setConfiguration(currentProject.config);
      };

      const bootstapUser = async () => {
        await setupProvider();
      };

      if (isAuthenticated) {
        Moralis.onChainChanged(async () => setupProvider());
        bootstapUser();
      }
      bootstrapProject();
    }, [Moralis, isAuthenticated]);

    useEffect(() => {
        loadConfiguration(configuration);
    },[configuration]);

    useEffect(() => {
        if (!user) return;
        if (!provider) return;
        const loadBalances = async () => {
          if (!provider?.getBalance) return;
          const balance = await provider.getBalance(user.get('ethAddress'));
          const currBalance = parseFloat(ethers.utils.formatEther(balance)).toFixed(3);
          setNativeBalance(currBalance);
        }
        loadBalances();
    }, [user, provider]);

    useEffect(() => {
        if (!configuration) return;
        if (!provider) return;
        const targetNetwork = project?.getNetworkContext(template)?.chainId;
        if (targetNetwork && provider.provider?.chainId)
          setRightNetwork(provider.provider.chainId === targetNetwork);
    }, [provider, configuration, project, template]);

    const verifyNetwork = async() => {
        if (!provider) return;
        if (!isAuthenticated) return;
        if (isRightNetwork) return;
        const network = project?.getNetworkContext(template);
        await switchToChain(network, provider.provider);
    }

    const switchToChain = async(network, currentProvider) => {
      if (!network) return;
      const chainId = network.chainId;
      if (!chainId) return;
      try {
        await currentProvider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId }]
        });
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
        const pref = getProviderPreference();
        pref.signingMessage = configuration.name;
        providerUser = await providerAuthenticate(pref);
        await setupProvider(pref);
        verifyNetwork();
        // Upsert user
        if (providerUser)
          await UserProfile.init(providerUser);
      } catch (e) {
        console.log(e);
      }
      return providerUser;
    }

    const getProviderInstance = async() => {
      const pref = getProviderPreference();
      const web3 = await Moralis.enableWeb3(pref);
      setProvider(web3);
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
        template,
        provider,
        switchToChain,
        getProviderInstance
    };
};

export default useDappify;
