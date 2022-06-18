export const cropText = (input = '', length = 10) => {
    let formattedInput;
    if (input.length > length) {
        formattedInput = `${input.substring(0, length-1)}...`;
    } else {
        formattedInput = input;
    }
    return formattedInput;
};

export const formatAddress = (input = '') => {
    return `${input.substring(0, 6)}...${input.substring(input.length-8, input.length)}`;
};

export const toUri = (value = '') => {
    return value.toLocaleLowerCase().replace(' ', '-');
}