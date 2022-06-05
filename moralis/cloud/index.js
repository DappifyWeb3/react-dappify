const logger = Moralis.Cloud.getLogger();

const getProjectFromUrl = async(url) => {
  logger.info(`[CALL] getProjectFromUrl with url ${url}`);
  const isDappifySubdomain = url.includes('dappify.');
  logger.info(`Is url a dappify subdomain? ${isDappifySubdomain}`);
  const hostname = new URL(url.replace("test.","")).hostname;
  const urlParts = hostname.split('.');
  const Project = Moralis.Object.extend("Project");
  const query = new Moralis.Query(Project);
  if (isDappifySubdomain) {
    const subdomain = urlParts.splice(0,urlParts.length-2).join('.');
    logger.info(`Loading project from subdomain ${subdomain}`);
  	query.equalTo("subdomain", subdomain);
  } else {
    const domain = urlParts.slice(0).slice(urlParts.length -2).join('.');
    logger.info(`Loading project from domain ${domain}`);
    query.equalTo("domain", domain);
  }
  const project = await query.first();
  logger.info(`Project found? ${project}`);
  return project;
};

const getUserProfile = async(project, user) => {
  logger.info(`[CALL] getUserProfile with project ${JSON.stringify(project)} and user ${JSON.stringify(user)}`);
  const UserProfile = Moralis.Object.extend("UserProfile");
  const query = new Moralis.Query(UserProfile);
  query.equalTo("project", project);
  query.equalTo("user", user);
  const profile = await query.first();
  logger.info(`UserProfile found? ${profile}`);
  return profile;
};

const updateUserProfile = async(userProfile, project, user) => {
  logger.info(`[CALL] updateUserProfile with project ${JSON.stringify(project)} and user ${JSON.stringify(user)}`);
  userProfile.set("project", project);
  userProfile.set("user", user);
  userProfile.set("wallet", user.get("ethAddress"));
  return await userProfile.save();
};

Moralis.Cloud.afterLogin(async (request) => {
  logger.info(`[AFTER_LOGIN] with request ${JSON.stringify(request)}`);
  const { object: user } = request;
  const originUrl = request.headers.origin;
  let project = await getProjectFromUrl(request.headers.origin);
  let userProfile = await getUserProfile(project, user);
  if (!userProfile) {
  	const UserProfile = Moralis.Object.extend("UserProfile");
  	userProfile = new UserProfile();
  }
  await updateUserProfile(userProfile, project, user);
});

Moralis.Cloud.beforeSave("TemplateVote", async(request) => {
  logger.info(`[CALL] TemplateVote with request ${JSON.stringify(request)} checking against ip:${request.ip} and template name: ${request.object.get("name")}`);
  request.object.set("ip", request.ip);
  request.object.set("info", request.headers);
  const TemplateVote = Moralis.Object.extend("TemplateVote");
  const query = new Moralis.Query(TemplateVote);
  query.equalTo("ip", request.ip);
  query.equalTo("name", request.object.get("name"));
  const vote = await query.first();
  if (vote)
    throw "You have already voted for this template!";
});

Moralis.Cloud.afterSave("NFTTokenTransaction", async(request) => {
  const supportedTx = {
    ON_AUCTION: 'auction',
    ON_SALE: 'sale',
    CLOSED: 'closed'
  }
  logger.info(`[AFTER_SAVE] After save NFTTokenTransaction with request ${JSON.stringify(request)}`);
  const NFTToken = Moralis.Object.extend("NFTToken");
  const nft = request.object.get("nft");
  logger.info(`[AFTER_SAVE] current NFT ${JSON.stringify(nft)}`);
  const query = new Moralis.Query(NFTToken);
  query.equalTo("objectId", nft.id);
  const nftToken = await query.first();
  const txType = request.object.get('type');
  logger.info(`[AFTER_SAVE] token found ${JSON.stringify(nftToken)} for TX ${JSON.stringify(txType)}`);
  if (txType === supportedTx.ON_AUCTION) {
  	const offerAmount = request.object.get("offer");
    const symbol = request.object.get("symbol");
    const offerer = request.object.get("offerer");
    logger.info(`Updating NFT with maxBid price of ${offerAmount}${symbol} from offerer ${JSON.stringify(offerer)}`);
    nftToken.set("maxBid", offerAmount);
    nftToken.set("symbol", symbol);
  } else if (txType === supportedTx.ON_SALE) {
    const currentOwner = request.object.get("owner");
    const offerAmount = request.object.get("offer");
    const symbol = request.object.get("symbol");
    const offerer = request.object.get("offerer");
    logger.info(`Updating NFT with purchase price of ${offerAmount}${symbol} from offerer ${JSON.stringify(offerer)}`);
    nftToken.set("price", offerAmount);
    nftToken.set("symbol", symbol);
    nftToken.set("owner", offerer);
    nftToken.set("status", supportedTx.CLOSED);
    await addUserTotalSales(currentOwner, offerAmount);
  } else {
  	throw "Unsupported transaction type";
  }
  return await nftToken.save();
  //if (vote)
    //throw "You have already voted for this template!";
});


Moralis.Cloud.afterSave("NFTOffer", async(request) => {

  logger.info(`[AFTER_SAVE] After save NFTOffer with request ${JSON.stringify(request)}`);
  
  if (request.object.get("status") === "OfferingClosed") {
    const offerAmount = request.object.get("price");
    const currentOwner = request.object.get("offerer");
    await addUserTotalSales(currentOwner, offerAmount);
  }
  
});
const addUserTotalSales = async (owner, offerAmount) => {
	const UserProfile = Moralis.Object.extend("UserProfile");
   	const query = new Moralis.Query(UserProfile);
  	query.equalTo("objectId", owner.id);
  	const userProfile = await query.first();
  	const currentSales = userProfile.get("totalSales") || 0;
  	const newSales = currentSales + offerAmount;
  	userProfile.set("totalSales", newSales);
  	return await userProfile.save();
};

Moralis.Cloud.define("getTotalTemplateVotes", async (request) => {
  logger.info(`[CALL] getTotalTemplateVotes with ip:${request.ip}`);
  const pipeline = [{ group: { objectId: '$name', count: { "$sum": 1 } }}];
  const query = new Moralis.Query('TemplateVote');
  return await query.aggregate(pipeline, {useMasterKey:true});
});

Moralis.Cloud.define("getMyTemplateVotes", async (request) => {
  logger.info(`[CALL] getMyTemplateVotes with ip:${request.ip}`);
  const TemplateVote = Moralis.Object.extend("TemplateVote");
  const query = new Moralis.Query(TemplateVote);
  query.equalTo("ip", request.ip);
  return await query.find();
});

Moralis.Cloud.beforeSave("NFTLike", async(request) => {
  logger.info(`[NFT_LIKE] beforeSave request ${JSON.stringify(request)}`);
  request.object.set("ip", request.ip);
});

Moralis.Cloud.afterSave("NFTLike", async(request) => {
  logger.info(`[NFT_LIKE] Liked request ${JSON.stringify(request)}`);
  const nft = request.object.get("nft");
  const NFTToken = Moralis.Object.extend("NFTToken");
  const query = new Moralis.Query(NFTToken);
  query.equalTo("objectId", nft.id);
  const nftToken = await query.first();
  const totalLikes = nftToken.get('likes') || 0;
  nftToken.set('likes', totalLikes + 1);
  nftToken.set('ip', request.ip);
  return await nftToken.save();
});

Moralis.Cloud.afterDelete("NFTLike", async(request) => {
  logger.info(`[NFT_LIKE] Unliked request ${JSON.stringify(request)}`);
  const nft = request.object.get("nft");
  const NFTToken = Moralis.Object.extend("NFTToken");
  const query = new Moralis.Query(NFTToken);
  query.equalTo("objectId", nft.id);
  query.equalTo('ip', request.ip);
  const nftToken = await query.first();
  const totalLikes = nftToken.get('likes') || 0;
  if (totalLikes > 0) {
  	nftToken.set('likes', totalLikes - 1);
  }
  return await nftToken.save();
});

Moralis.Cloud.define("getNFTLikes", async (request) => {
  logger.info(`[CALL] getNFTLikes with request${request}`);
  const NFTLike = Moralis.Object.extend("NFTLike");
  const query = new Moralis.Query(NFTLike);
  if (request.params.userId) {
  	logger.info(`Query for user ip: ${request.params.userId}`);
    const UserProfile = Moralis.Object.extend("UserProfile");
    const query = new Moralis.Query(UserProfile);
    query.equalTo("objectId", request.params.userId);
    const targetProfile = await query.first();
    query.equalTo("user", targetProfile);
  } else {
  	logger.info(`Query for self ip: ${request.ip}`);
    query.equalTo("ip", request.ip);
  }
  query.includeAll();
  return await query.find({ masterKey: true });
});

Moralis.Cloud.define("getTokenPrice", async (request) => {
  let project = await getProjectFromUrl(request.headers.origin);
  const config = project.get("config");
  const mconfig = await Moralis.Config.get({useMasterKey: true});
  const apiKey = mconfig.get("apiKey");
  const contract = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
  return await Moralis.Cloud.httpRequest({
    url: `https://deep-index.moralis.io/api/v2/erc20/${contract}/price`,
    params: {
      chain: 'bsc'
    },
   headers: {
     'accept' : 'application/json',
     'X-API-Key': apiKey
   }
  })
});

Moralis.Cloud.define("search", async (request) => {
  let project = await getProjectFromUrl(request.headers.origin);
  logger.info(`[CALL] search with filter ${request.params.filter} for project ${project.get("subdomain")}`);
  const NFTOffer = Moralis.Object.extend("NFTOffer");
  const itemQuery = new Moralis.Query(NFTOffer);
  itemQuery.equalTo("project", project);
  itemQuery.equalTo("status", "OfferingPlaced");
  itemQuery.contains('metadata.name', request.params.filter);
  itemQuery.limit(5);
  itemQuery.includeAll();
  const items = await itemQuery.find({ masterKey: true });
  const Profile = Moralis.Object.extend("UserProfile");
  const profileQuery = new Moralis.Query(Profile);
  profileQuery.equalTo("project", project);
  profileQuery.contains('username', request.params.filter);
  profileQuery.limit(5);
  profileQuery.includeAll();
  const profiles = await profileQuery.find({ masterKey: true });
  return [...items,...profiles];
});

Moralis.Cloud.define("getNftsForAddress", async (request) => {
  let project = await getProjectFromUrl(request.headers.origin);
  const config = project.get("config");
  const mconfig = await Moralis.Config.get({useMasterKey: true});
  const apiKey = mconfig.get("apiKey");
  logger.info(`[CALL] getNfts for address ${request.params.address} for project ${project.get("subdomain")} on chain ${request.params.chainId}`);
  const network = request.params.chainId;
  const address = request.params.address;
  return await Moralis.Cloud.httpRequest(
    {
      url: `https://deep-index.moralis.io/api/v2/${address}/nft`,
      params: {
        chain: network,
        format: 'decimal'
      },
      headers: {
       'accept' : 'application/json',
       'X-API-Key': apiKey
      }
    });
});

Moralis.Cloud.beforeSave("Project", async (request) => {
  logger.info(`[BEFORE_SAVE] Project with request ${JSON.stringify(request)}`);
  if (!request.object.id) {
    const { user } = request;
    const subdomain = request.object.get("subdomain");
    const query = new Moralis.Query("Project");
    query.equalTo("subdomain", subdomain);
    const existingProject = await query.first({ useMasterKey: true });
    if (existingProject) {
      throw "Subdomain already exists";
    } else {
      request.object.set("owner", user);
    }
  }
});