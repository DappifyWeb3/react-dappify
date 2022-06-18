import Moralis from 'moralis';
import Project from '../model/Project';
import { getImage } from '../utils/image';

export default class UserProfile {

    id;
    username;
    bio;
    image;
    banner;
    verified;
    email;
    website;
    twitter;
    instagram;
    facebook;
    wallet;
    totalSales;
    createdAt;
    updatedAt;

    source;

    constructor(user) {
        if (typeof user === 'string' || user instanceof String) return this.#fromRest(user);
        return this.#fromProvider(user);
    }

    #fromProvider = (user) => {
        this.id = user.id;
        this.username = user.get('username');
        this.bio = user.get('bio');
        this.image = getImage(user.get('image'));
        this.banner = getImage(user.get('banner'));
        this.verified = user.get('verified') || false;
        this.email = user.get('email');
        this.website = user.get('website');
        this.twitter = user.get('twitter');
        this.instagram = user.get('instagram');
        this.facebook = user.get('facebook');
        this.wallet = user.get('wallet') || user.get('ethAddress');
        this.totalSales = user.get('totalSales') || 0;
        this.createdAt = user.get('createdAt');
        this.updatedAt = user.get('updatedAt');
        this.source = user;
        return this;
    }

    #fromRest = (user) => {
        this.wallet = user;
        return this;
    }

    setImage = async(file) => {
        const imageFile = new Moralis.File(file.name, file);
        const ipfsFile = await imageFile.saveIPFS();
        this.image = ipfsFile.ipfs();
        return this;
    }

    setBanner = async(file) => {
        const imageFile = new Moralis.File(file.name, file);
        const ipfsFile = await imageFile.saveIPFS();
        this.banner = ipfsFile.ipfs();
        return this;
    }

    save = async({profileImage, bannerImage}) => {
        if (profileImage) await this.setImage(profileImage);
        if (bannerImage) await this.setBanner(bannerImage);
        const context = await UserProfile.getCurrentUserContext();
        const { currentProject, currentUser, currentProfile } = context;
        let userProfile = currentProfile.source;
        if (!userProfile) {
            const UserProfile = Moralis.Object.extend('UserProfile');
            userProfile = new UserProfile();
        }
        this.username && userProfile.set('username', this.username);
        this.bio && userProfile.set('bio', this.bio);
        this.image && userProfile.set('image', this.image);
        this.banner && userProfile.set('banner', this.banner);
        this.email && userProfile.set('email', this.email);
        this.webtiste && userProfile.set('website', this.webtiste);
        this.twitter && userProfile.set('twitter', this.twitter);
        this.instagram && userProfile.set('instagram', this.instagram);
        this.wallet && userProfile.set('wallet', currentUser.get('ethAddress'));
        this.totalSales && userProfile.set('totalSales', this.totalSales);
        userProfile.set('user', currentUser);
        userProfile.set('project', currentProject.source);
        await userProfile.save();
        return this;
    }

    setVerified = async(isVerified) => {
        this.source.set('verified', isVerified);
        await this.source.save();
        return this;
    }

    static init = async(user) => {
        const currentProject = await Project.getInstance();
        const UserProfile = Moralis.Object.extend("UserProfile");
        const query = new Moralis.Query(UserProfile);
        query.equalTo("project", currentProject.source);
        query.equalTo("user", user);
        let profile = await query.first();
        if (!profile) {
            const Profile = Moralis.Object.extend('UserProfile');
            profile = new Profile();
            profile.set("project", currentProject.source);
            profile.set("user", user);
            profile.set("wallet", user.get("ethAddress"));
            await profile.save();
        } else {
            return profile;
        }

    }

    static getCurrentUser = async() => {
        const context = await UserProfile.getCurrentUserContext();
        return context.currentProfile;
    }

    static getCurrentUserContext = async() => {
        const currentProject = await Project.getInstance();
        const currentUser = Moralis.User.current();
        const query = new Moralis.Query('UserProfile');
        query.equalTo('user', currentUser);
        query.equalTo('project', currentProject.source);
        const profile = await query.first();
        const currentProfile = new UserProfile(profile);
        return {
            currentProject,
            currentUser,
            currentProfile
        }
    }

    static getRankingBySales = async() => {
        const currentProject = await Project.getInstance();
        const query = new Moralis.Query('UserProfile');
        query.equalTo('project', currentProject.source);
        query.descending('totalSales');
        query.limit(12);
        const topSellers = await query.find() || [];
        return topSellers.map((seller) => new UserProfile(seller));
    }

    static getUser = async(address) => {
        const currentProject = await Project.getInstance();
        const query = new Moralis.Query('UserProfile');
        query.equalTo('project', currentProject.source);
        query.equalTo('wallet', address);
        query.includeAll();
        const user = await query.first();
        return user ? new UserProfile(user) : null;
    }

    static listUsersByProject = async({ projectId, page = 0, limit = 20 }) => {
        const projects = new Moralis.Query('Project');
        projects.equalTo('objectId', projectId);
        const project = await projects.first();
        const query = new Moralis.Query('UserProfile');
        query.equalTo('project', project);
        query.descending('totalSales');
        query.limit(limit);
        query.skip(page*limit);
        query.withCount();
        const response = await query.find() || {};
        const users = response.results.map((user) => new UserProfile(user));
        return {
            results: users,
            count: response.count
        }
    }
}
