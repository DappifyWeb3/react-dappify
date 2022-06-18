
import CoinbaseConnector from '../connectors/CoinbaseConnector';

const baseUrl = `https://s3.amazonaws.com/dappify.assets/wallet`;

export const supportedWallets = [
    { 
        id: 'metamask', 
        payload: { 
            provider: 'metamask' 
        },  
        image: `${baseUrl}/1.png`, 
        tag: 'Most popular', 
        name: 'Metamask',
        description: 'Start exploring blockchain applications in seconds.  Trusted by over 1 million users worldwide.'
    },
    { 
        id: 'coinbase', 
        payload: { 
            connector: CoinbaseConnector 
        }, 
        image: `${baseUrl}/5.png`, 
        name: 'Coinbase',
        description: 'The easiest and most secure crypto wallet. No Coinbase account required.'
    },
    { 
        id: 'walletconnect', 
        payload: { 
            provider: 'walletconnect' 
        }, 
        image: `${baseUrl}/4.png`, 
        name: 'WalletConnect',
        description: 'Open source protocol for connecting decentralised applications to mobile wallets.'
    }
    // { id: 'torus', image: `${baseUrl}/8.png`, tag: 'Most Simple', name: 'Torus', description: 'Open source protocol for connecting decentralised applications to mobile wallets.' },
    // { id: 'bitski', image: `${baseUrl}/9.png`, name: 'Bitski', description: 'Bitski connects communities, creators and brands through unique, ownable digital content.' },
    // { id: 'formatic', image: `${baseUrl}/3.png`, name: 'Fortmatic', description: 'Let users access your Ethereum app from anywhere. No more browser extensions.' },
    // { id: 'arkane', image: `${baseUrl}/6.png`, name: 'Arkane', description: 'Make it easy to create blockchain applications with secure wallets solutions.' },
    // { id: 'authereum', image: `${baseUrl}/7.png`, name: 'Authereum', description: 'Your wallet where you want it. Log into your favorite dapps with Authereum.' }
];
