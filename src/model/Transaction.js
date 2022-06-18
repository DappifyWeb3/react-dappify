import Moralis from 'moralis';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';
import UserProfile from '../model/UserProfile';

export default class Transaction {

    id;
    from;
    to;
    amount;
    symbol;
    createdAt;
    updatedAt;
    chainId;
    transactionHash;
    contract;
    tokenId;
    uri;
    uid;
    metadata;
    status;
    name;
    category;
    event;
    type;
    quantity;

    source;

    constructor(tx) {
        if (isEmpty(tx)) {

        } else if (!isEmpty(tx.id)) {
            // Created already
            this.id = tx.id;
            this.from = tx.get('from');
            this.to = tx.get('to');
            this.amount = tx.get('amount');
            this.symbol = tx.get('symbol');
            this.chainId = tx.get('chainId');
            this.metadata = tx.get('metadata');
            this.uri = tx.get('uri');
            this.uid = tx.get('uid');
            this.contract = tx.get('contract');
            this.tokenId = tx.get('tokenId');
            this.event = tx.get('tokenId');
            this.category = tx.get('category');
            this.transactionHash = tx.get('transactionHash');
            this.status = tx.get('status');
            this.type = tx.get('type');
            this.quantity = tx.get('quantity');
            this.createdAt = moment(tx.get('createdAt'));
            this.updatedAt = moment(tx.get('updatedAt'));
            this.source = tx;
        } else {
            // Creating new
            this.uid = tx.uid;
            this.transactionHash = tx.transactionHash;
            this.to = tx.to;
            this.amount = tx.amount;
            this.contract = tx.contract;
            this.tokenId = tx.tokenId;
            this.uri = tx.uri;
            this.metadata = tx.metadata;
            this.status = tx.status;
            this.symbol = tx.symbol;
            this.name = tx.name;
            this.chainId = tx.chainId;
            this.category = tx.category;
            this.event = tx.event;
            this.type = tx.type;
            this.quantity = tx.quantity;
        }
        return this;
    }

    save = async() => {
        const context = await UserProfile.getCurrentUserContext();
        const { currentProfile, currentProject } = context;

        const Tx = Moralis.Object.extend('Transaction');
        const tx = new Tx();
        tx.set('project', currentProject.source);
        tx.set('from', currentProfile.source);
        tx.set('uid', this.uid);
        tx.set('amount', this.amount);
        tx.set('contract', this.contract);
        tx.set('tokenId', this.tokenId);
        tx.set('event', this.event);
        tx.set('to', this.to);
        tx.set('uri', this.uri);
        tx.set('metadata', this.metadata);
        tx.set('status', this.status);
        tx.set('symbol', this.symbol);
        tx.set('name', this.name);
        tx.set('chainId', this.chainId);
        tx.set('category', this.category);
        tx.set('type', this.type);
        tx.set('quantity', this.quantity);
        tx.set('transactionHash', this.transactionHash);
        return await tx.save();
    }

    static listByProject = async({ projectId, page = 0, limit = 20, filters = [] }) => {
        const projects = new Moralis.Query('Project');
        projects.equalTo('objectId', projectId);
        const project = await projects.first();
        const query = new Moralis.Query('Transaction');
        query.equalTo('project', project);

        filters.forEach((filter) => {
            switch (filter?.type) {
                case 'equalTo':
                    query.equalTo(filter.key, filter.value);
                    break;
                case 'fullText':
                    query.fullText(filter.key, filter.value);
                    break;
                case 'contains':
                    query.contains(filter.key, filter.value);
                    break;
                default:
                    query.equalTo(filter.key, filter.value);
            }
        });

        query.descending('updatedAt');
        query.limit(limit);
        query.skip(page*limit);
        query.withCount();
        const response = await query.find() || {};
        const txs = response.results.map((tx) => new Transaction(tx));
        return {
            results: txs,
            count: response.count
        }
    }
}
