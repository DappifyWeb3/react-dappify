// https://docs.opensea.io/docs/metadata-standards
export default class Attribute {

    type;
    value;
    display;

    constructor(attribute) {
        this.type = attribute.trait_type;
        this.value = attribute.value;
        this.display = attribute.display_type;
    }

    toJson = () => {
        return {
            trait_type: this.type,
            value: this.value,
            display_type: this.display
        }
    }
}