import Moralis from 'moralis';
import { ethers } from 'ethers';
import MarketplaceContract from 'react-dappify/contracts/ERC721MarketplaceV1.sol/ERC721MarketplaceV1.json';
import { getProviderPreference } from 'react-dappify/utils/localStorage';
import isEmpty from 'lodash/isEmpty';

export default class Marketplace {

    contract;
    marketplaceAddress;

    constructor(contractAddress) {
        if (isEmpty(contractAddress)) {
            throw new Error('The Marketplace contract is not deployed in this network');
        }
        this.marketplaceAddress = contractAddress.toLowerCase();
        return this;
    }

    init = async() => {
        Moralis.start({ 
			appId:process.env.REACT_APP_MORALIS_APP_ID, 
			serverUrl:process.env.REACT_APP_MORALIS_SERVER_URL 
		});
        const pref = getProviderPreference();
        const web3Provider = await Moralis.enableWeb3(pref);
        const signer = web3Provider.getSigner();
        this.contract = new ethers.Contract(this.marketplaceAddress, MarketplaceContract.abi, signer);
		this.signer = signer;
        return this;
    }
}