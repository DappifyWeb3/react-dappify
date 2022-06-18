export default class Status {

    static ON_AUCTION = 'auction';
    static AUCTION_CLOSED = 'closed';
    static ON_SALE = 'sale';
    static PUBLISHED = 'published';
    static CLOSED = 'closed';

    name;

    constructor(){
        this.name = Status.ON_AUCTION;
    }
};