import Nft from "../model/NFT";
import UserProfile from "../model/UserProfile";

export default class Like {

    id;
    nft;
    user;
    ip;

    source;

    constructor(like) {
        this.id = like.id;
        this.ip = like.get('ip');
        const user = like.get('user');
        this.user = user && new UserProfile(user);
        const nft = like.get('nft');
        this.nft = new Nft(nft);
        this.source = like;
        return this;
    }
}