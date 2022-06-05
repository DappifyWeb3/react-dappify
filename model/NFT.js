// https://docs.opensea.io/docs/metadata-standards
import Moralis from 'moralis';
import { ethers } from 'ethers';
import UserProfile from 'react-dappify/model/UserProfile';
import Collection from 'react-dappify/model/Collection';
import Metadata from 'react-dappify/model/Metadata';
import Marketplace from 'react-dappify/model/Marketplace';
import TokenContract from 'react-dappify/contracts/ERC721TokenV1.sol/ERC721TokenV1.json';
import Transaction from 'react-dappify/model/Transaction';
import axios from 'axios';
import { Logger } from 'react-dappify/utils/log';

export default class Nft {

    id;
    tokenId;
    collection;
    status;
    author;
    owner;
    metadataUri;
    metadata = {};
    price;
    bid;
    maxBid;
    likes;
    views;
    publishedAt;
    createdAt;
    updatedAt;
    offeringId;
    buyer;
    hash;
    category;

    source;

    constructor(nft) {
        if (nft instanceof Nft) return this.#fromClone({...nft});
        if (nft.contract_type) return this.#fromRest(nft);
        return this.#fromProvider(nft);
    }

    #fromProvider = (nft) => {
        this.id = nft.id;
        this.tokenId = parseInt(nft.tokenId || nft.get('tokenId'));
        this.collection = new Collection(nft);
        this.status = nft.get('status');
        this.owner = nft.get('from') && new UserProfile(nft.get('from'));
        this.buyer = nft.get('to') && new UserProfile(nft.get('to'));
        this.metadataUri = nft.get('uri');
        this.metadata = new Metadata(nft.get('metadata'));
        this.price = nft.get('amount') || 0;
        this.createdAt = nft.get('createdAt');
        this.updatedAt = nft.get('updatedAt');
        this.offeringId = nft.get('uid');
        this.hash = nft.get('transactionHash');
        this.category = nft.get('category');
        this.source = nft;
        return this;
    }

    #fromRest = (nft) => {
        this.id = '';
        this.tokenId = nft.token_id;
        this.collection = new Collection(nft);
        this.owner = new UserProfile(nft.owner_of);
        const metadata = JSON.parse(nft.metadata);
        this.metadata = new Metadata(metadata, nft.token_uri);
        this.price = 0;
        this.likes = 0;
        this.views = 0;
        this.createdAt = nft.synced_at;
        this.updatedAt = nft.synced_at;
        this.maxBid = 0;
        this.source = nft;
        return this;
    }

    #fromClone = (nft) => {
        for (const [key, value] of Object.entries(nft)) {
            this[key] = value;
        }
        return this;
    }

    save = async(collection, imageFile, animationFile) => {
        // this.metadata_uri = await this.metadata.save(imageFile, animationFile);
        // const context = await UserProfile.getCurrentUserContext();
        // const { currentProject, currentProfile } = context;
        // const NFTOffer = Moralis.Object.extend('NFTOffer');
        // const nft = new NFTOffer();
        // this.metadata_uri && nft.set('metadataUri', this.metadata_uri);
        // this.metadata && nft.set('metadata', this.metadata.toJson());
        // this.status && nft.set('status', this.status);
        // this.price && nft.set('price', this.price);
        // nft.set('owner', currentProfile.source);
        // nft.set('author', currentProfile.source);
        // nft.set('project', currentProject.source);
        // nft.set('collection', collection.source);
        // return await nft.save();
    }

    sellTo = async(price, category) => {
        const context = await UserProfile.getCurrentUserContext();
        const { currentProject } = context;

        // Soft check if we have already an OfferingPlaced for this item so we avoid duplicating from UI
        const query = new Moralis.Query('Transaction');
        query.equalTo('project', context.currentProject.source);
        query.equalTo('status', "OfferingPlaced");
        query.equalTo('contract', this.collection.address);
        query.equalTo('tokenId', this.tokenId.toString());
        query.descending("updatedAt");
        const previousOffering = await query.first() || {};
        if (previousOffering.id) {
            throw new Error(`This item is already in the marketplace`);
        }

        const chainId = currentProject.config.chainId;
        const contractAddress = currentProject.config.template[process.env.REACT_APP_TEMPLATE_NAME].contract[chainId];
        let marketplace = new Marketplace(contractAddress);
        marketplace = await marketplace.init();

        // grant permission to marketplace
        const tokenContact = new ethers.Contract(this.collection.address, TokenContract.abi, marketplace.signer);
        const getappr = await tokenContact.getApproved(this.tokenId);
        if (getappr !== contractAddress) {
            const txApprove = await tokenContact.approve(marketplace.marketplaceAddress, this.tokenId);
            await txApprove.wait();
        }

        const transaction = await marketplace.contract.placeOffering(   this.collection.address, 
                                                                        this.tokenId, 
                                                                        ethers.utils.parseEther(JSON.stringify(price)),
                                                                        currentProject.config.operator
                                                                    );
        const tx = await transaction.wait();
        const event = tx.events.filter((e) => e.event === "OfferingPlaced")[0].args;
        const tokenURI = await tokenContact.tokenURI(this.tokenId);
        Logger.debug(tx);
        const dappifyTx = new Transaction({
            uid: event.offeringId,
            amount: price,
            contract: this.collection.address.toLowerCase(),
            tokenId: this.tokenId,
            uri: tokenURI,
            metadata: this.metadata.source,
            status: "OfferingPlaced",
            symbol: this.collection.symbol,
            name: this.collection.name,
            chainId: chainId,
            category: category.toLowerCase(),
            transactionHash: tx.transactionHash,
            event: tx
        });
        await dappifyTx.save();

        return tx.transactionHash;
    }

    purchase = async() => {
        const context = await UserProfile.getCurrentUserContext();
        const { currentProfile, currentProject } = context;
        const chainId = currentProject.config.chainId;
        const contractAddress = currentProject.config.template[process.env.REACT_APP_TEMPLATE_NAME].contract[chainId];
        let marketplace = new Marketplace(contractAddress);
        marketplace = await marketplace.init();
        let transaction = await marketplace.contract.closeOffering(this.offeringId, { value: ethers.utils.parseEther(JSON.stringify(this.price)) });
        const tx = await transaction.wait();
        this.source.set('status', 'OfferingClosed');
        this.source.set('to', currentProfile.source);
        this.source.set('transactionHash', tx.transactionHash);
        await this.source.save();

        // Update seller
        this.owner.totalSales += this.price;
        await this.owner.save({});

        return tx.transactionHash;
    }

    editPricing = async(price) => {
        const context = await UserProfile.getCurrentUserContext();
        const { currentProject } = context;
        const chainId = currentProject.config.chainId;
        const contractAddress = currentProject.config.template[process.env.REACT_APP_TEMPLATE_NAME].contract[chainId];
        let marketplace = new Marketplace(contractAddress);
        marketplace = await marketplace.init();
        const newPricing = ethers.utils.parseEther(JSON.stringify(price));
        const transaction = await marketplace.contract.updateOffering(this.offeringId, newPricing);
        const tx = await transaction.wait();
        this.source.set('amount', price);
        await this.source.save();
        return tx.transactionHash;
    }

    withdrawFromMarketplace = async() => {
        const context = await UserProfile.getCurrentUserContext();
        const { currentProject } = context;
        const chainId = currentProject.config.chainId;
        const contractAddress = currentProject.config.template[process.env.REACT_APP_TEMPLATE_NAME].contract[chainId];
        let marketplace = new Marketplace(contractAddress);
        marketplace = await marketplace.init();
        let transaction = await marketplace.contract.withdrawOffering(this.offeringId);
        const tx = await transaction.wait();
        this.source.set('status', 'OfferingWithdrawn');
        this.source.set('transactionHash', tx.transactionHash);
        await this.source.save();
        return tx.transactionHash;

    }

    bidBy = async(userProfile, amount) => {
        // const context = await UserProfile.getCurrentUserContext();
        // const { currentProject } = context;
        // const NFTOfferTransaction = Moralis.Object.extend('NFTOfferTransaction');
        // const nftSale = new NFTOfferTransaction();
        // nftSale.set('project', currentProject.source);
        // nftSale.set('nft', this.source);
        // nftSale.set('owner', this.owner.source);
        // nftSale.set('offer', amount);
        // nftSale.set('offerer', userProfile.source);
        // nftSale.set('symbol', currentProject.config.symbol);
        // nftSale.set('type', Status.ON_AUCTION);
        // return await nftSale.save();
    }

    like = async() => {
        // const context = await UserProfile.getCurrentUserContext();
        // const { currentProfile, currentProject } = context;
        // const likeQuery = new Moralis.Query('NFTLike');
        // likeQuery.equalTo('project', currentProject.source);
        // likeQuery.equalTo('nft', this.source);
        // likeQuery.equalTo('user', currentProfile.source);
        // const targetNft = await likeQuery.first();
        // if (targetNft) {
        //     // Remove like
        //     return await targetNft.destroy();
        // } else {
        //     // Add like
        //     const NFTLike = Moralis.Object.extend('NFTLike');
        //     const like = new NFTLike();
        //     like.set('project', currentProject.source);
        //     like.set('nft', this.source);
        //     like.set('user', currentProfile.source);
        //     return await like.save();
        // }

    }

    static getNewestDrops = async() => {
        const context = await UserProfile.getCurrentUserContext();
        const query = new Moralis.Query('Transaction');
        query.equalTo('project', context.currentProject.source);
        query.equalTo('status', 'OfferingPlaced');
        query.descending('createdAt');
        query.limit(20);
        query.include('from');
        const nfts = await query.find() || [];
        const nftsList = nfts.map((nft) => new Nft(nft));
        return nftsList;
    }

    static getHotAuctions = async() => {
        const context = await UserProfile.getCurrentUserContext();
        const query = new Moralis.Query('Transaction');
        query.equalTo('project', context.currentProject.source);
        query.equalTo('status', 'OfferingPlaced');
        query.descending('createdAt');
        query.limit(20);
        query.include('from');
        const nfts = await query.find() || [];
        const nftsList = nfts.map((nft) => new Nft(nft));
        return nftsList;
    }

    static getUserLikes = async(userProfile) => {
        // await UserProfile.getCurrentUserContext();
        // const likes = await Moralis.Cloud.run('getNFTLikes', { userId: userProfile?.id });
        // const nftLikes = likes.map((like) => new Like(like));
        // return nftLikes;
    }

    static getById = async(collectionAddress, tokenId) => {
        const context = await UserProfile.getCurrentUserContext();
        const query = new Moralis.Query('Transaction');
        query.equalTo('project', context.currentProject.source);
        query.equalTo('tokenId', tokenId);
        query.equalTo('contract', collectionAddress);
        query.include('from');
        query.descending('updatedAt');
        const nfts = await query.find() || [];
        const nftsList = nfts.map((nft) => new Nft(nft));
        return nftsList;
    }

    static fromCollection = async(collection) => {
        // const context = await UserProfile.getCurrentUserContext();
        // const query = new Moralis.Query('Transaction');
        // query.equalTo('project', context.currentProject.source);
        // query.equalTo('collection', collection.source);
        // query.include('author');
        // query.include('owner');
        // const nfts = await query.find() || [];
        // const nftsList = nfts.map((nft) => new Nft(nft));
        // return nftsList;
    }

    static getFromUser = async(userProfile) => {
        const context = await UserProfile.getCurrentUserContext();
        const { currentProject } = context;
        const chainId = currentProject.config.chainId;

        if (!userProfile.wallet) return [];

        let items = [];
        try {
            items = await axios.get(`https://deep-index.moralis.io/api/v2/${userProfile.wallet}/nft?chain=${chainId}&format=decimal`, {
                headers: {
                    'X-API-Key': process.env.REACT_APP_MORALIS_API_KEY,
                    accept: 'application/json'
                }
            });
        } catch (e) {
            Logger.error(e);
        }

        const resolvedItems = items?.data?.result;
        const ownedItems = resolvedItems.map((nft) => new Nft(nft));

        const ownerOfQuery = new Moralis.Query('Transaction');
        ownerOfQuery.equalTo('from', userProfile.source);
        ownerOfQuery.includeAll();
        const nfts = await ownerOfQuery.find() || [];
        const nftsList = nfts.map((nft) => new Nft(nft));
        return [...nftsList,...ownedItems];
    }

    static getWithFilters = async({category, status}) => {
        const context = await UserProfile.getCurrentUserContext();
        const query = new Moralis.Query('Transaction');
        query.equalTo('project', context.currentProject.source);
        if (status) query.equalTo('status', status);
        if (category) query.equalTo('category', category.toLowerCase());
        query.includeAll();
        query.descending('updatedAt');
        const nfts = await query.find() || [];
        const nftsList = nfts.map((nft) => new Nft(nft));
        return nftsList;
    }

    static fullTextSearch = async(text) => {
        const context = await UserProfile.getCurrentUserContext();
        const TX = Moralis.Object.extend('Transaction');
        const itemQuery = new Moralis.Query(TX);
        itemQuery.equalTo('project', context.currentProject.source);
        itemQuery.equalTo('status', 'OfferingPlaced');
        itemQuery.contains('metadata.name', text);
        itemQuery.limit(5);
        itemQuery.includeAll();
        const items = await itemQuery.find();
        const Profile = Moralis.Object.extend('UserProfile');
        const profileQuery = new Moralis.Query(Profile);
        profileQuery.equalTo("project", context.currentProject.source);
        profileQuery.fullText('username', text);
        profileQuery.limit(5);
        profileQuery.includeAll();
        const profiles = await profileQuery.find();
        const itemsFound = [...items.map((item) => new Nft(item)),...profiles.map((item) => new UserProfile(item))];
        return itemsFound;
    }
}