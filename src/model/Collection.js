import Moralis from 'moralis';
import UserProfile from '../model/UserProfile';

export default class Collection {

    id;
    name;
    description;
    shortUrl;
    symbol;
    address;
    chain;
    author;
    banner;
    createdAt;
    publishedAt;

    source;

    constructor(collection) {
        if (collection?.token_id) return this.#fromRest(collection);
        return this.#fromProvider(collection);
    }

    #fromProvider = (collection) => {
        this.id = collection.id;
        this.name = collection.get('name');
        this.symbol = collection.get('symbol');
        this.address = collection.get('contract');
        this.chain = collection.get('chainId');
        const author = collection.get('author');
        this.author = author ? new UserProfile(author) : null;
        this.source = collection;
        return this;
    }

    #fromRest = (collection) => {
        this.address = collection.token_address.toLowerCase();
        this.symbol = collection.symbol;
        this.name = collection.name;
        return this;
    }

    static getHotCollections = async () => {
        const context = await UserProfile.getCurrentUserContext();
        const query = new Moralis.Query('NFTCollection');
        query.equalTo('project', context.currentProject.source);
        query.equalTo('isHot', true);
        query.include('author');
        query.descending('createdAt');
        const hotCollections = await query.find() || [];
        const collectionObjects = hotCollections.map((collection) => new Collection(collection));
        return collectionObjects;
    }

    static getCollection = async (shortUrl) => {
        const context = await UserProfile.getCurrentUserContext();
        const query = new Moralis.Query('NFTCollection');
        query.equalTo('project', context.currentProject.source);
        query.equalTo('shortUrl', shortUrl);
        query.include('author');
        const collection = await query.first() || {};
        return new Collection(collection);
    }

    static getCurrentUserCollections = async() =>{
        const context = await UserProfile.getCurrentUserContext();
        const query = new Moralis.Query('NFTCollection');
        query.equalTo('author', context.currentProfile.source);
        query.equalTo('project', context.currentProject.source);
        query.include('author');
        query.descending('createdAt');
        const userCollections = await query.find() || [];
        const collectionObjects = userCollections.map((collection) => new Collection(collection));
        return collectionObjects;
    }

    setImage = async(file) => {
        if (!file) return this;
        const imageFile = new Moralis.File(file.name, file);
        const ipfsFile = await imageFile.saveIPFS();
        this.banner = ipfsFile.ipfs();
        return this;
    }

    save = async() => {
        const context = await UserProfile.getCurrentUserContext();
        const { currentProject, currentProfile } = context;
        const NFTCollection = Moralis.Object.extend('NFTCollection');
        const collection = new NFTCollection();
        this.name && collection.set('name', this.name);
        this.description && collection.set('description', this.description);
        this.shortUrl && collection.set('shortUrl', this.shortUrl);
        this.symbol && collection.set('symbol', this.symbol);
        this.banner && collection.set('banner', this.banner);
        collection.set('author', currentProfile.source);
        collection.set('project', currentProject.source);
        collection.set('isHot', true);
        await collection.save();
        return this;
    }

    getNfts = async() => {
        
    }
}