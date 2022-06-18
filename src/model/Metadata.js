// https://docs.opensea.io/docs/metadata-standards
import Moralis from 'moralis';
import Attribute from "../model/Attribute";
import { getImage } from '../utils/image';

export default class Metadata {

    image;
    image_data;
    external_url;
    description;
    name;
    attributes = [];
    background_color;
    animation_url;
    youtube_url;
    uri;
    source;

    constructor(nft, uri) {
        if (nft) return this.#fromProvider(nft);
        return this.#fromRest(uri);
    }

    #fromProvider = (metadata) => {
        this.name = metadata.name;
        this.image = getImage(metadata.image);
        this.image_data = metadata.image_data;
        this.external_url = metadata.external_url;
        this.description = metadata.description;
        this.background_color = metadata.background_color;
        this.animation_url = metadata.animation_url;
        this.youtube_url = metadata.youtube_url;
        this.attributes = metadata.attributes?.map((attribute) => new Attribute(attribute));
        this.source = metadata;
        return this;
    }

    #fromRest = (uri) => {
        this.uri = getImage(uri);
        return this;
    }

    toJson = () => {
        return {
            image: this.image,
            image_data: this.image_data,
            external_url: this.external_url,
            description: this.description,
            name: this.name,
            attributes: this.attributes.map((attribute) => attribute.toJson()),
            background_color: this.background_color,
            animation_url: this.animation_url,
            youtube_url: this.youtube_url
        }
    }

    save = async(imageFile, animationFile) => {
        if (imageFile) {
            const file = new Moralis.File(imageFile.name, imageFile);
            const ipfsFile = await file.saveIPFS();
            this.image = ipfsFile.ipfs();
        }
        if (animationFile) {
            const file = new Moralis.File(animationFile.name, animationFile);
            const ipfsFile = await file.saveIPFS();
            this.animation_url = ipfsFile.ipfs();
        }
        const fileMetadata = new Moralis.File('metadata.json', {base64: btoa(JSON.stringify(this.toJson()))});
        const fileMetadataResult = await fileMetadata.saveIPFS();
        return fileMetadataResult.ipfs();
    }
};