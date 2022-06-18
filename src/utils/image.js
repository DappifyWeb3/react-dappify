export const getImage = (url) => {
    if(!url) return url;
    if(!url.includes('ipfs/')) return url;
    const components = url.split('/');
    const destination = `https://ipfs.io/ipfs/${components[components.length-1]}`;
    return destination;
}

export const getImageHash = (url) => {
    if(!url) return url;
    if(!url.includes('ipfs/')) return url;
    const components = url.split('/');
    const destination = `ipfs/${components[components.length-1]}`;
    return destination;
}