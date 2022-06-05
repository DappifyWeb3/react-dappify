const constants = {
    NETWORKS : {
        // Ethereum
        "0x1": {
            chainId: "0x1",
            chainName: "Ethereum Mainnet",
            rpcUrls: ["https://mainnet.infura.io/v3/"],
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            blockExplorerUrls: ["https://etherscan.io"]
        },
        "0x5": {
            chainId: "0x5",
            chainName: "Goerli Testnet",
            rpcUrls: ["https://goerli.infura.io/v3/"],
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            blockExplorerUrls: ["https://goerli.etherscan.io"]
        },
        "0x2a": {
            chainId: "0x2a",
            chainName: "Kovan Testnet",
            rpcUrls: ["https://kovan.infura.io/v3/"],
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            blockExplorerUrls: ["https://kovan.etherscan.io"]
        },
        // Polygon
        "0x89": {
            chainId: "0x89",
            chainName: "Polygon Mainnet",
            rpcUrls: ["https://rpc-mainnet.maticvigil.com/"],
            nativeCurrency: {
              name: "Matic",
              symbol: "Matic",
              decimals: 18,
            },
            blockExplorerUrls: ["https://explorer.matic.network"]
        },
        "0x13881": {
            chainId: "0x13881",
            chainName: "Mumbai Testnet",
            rpcUrls: ["https://rpc-mumbai.matic.today"],
            nativeCurrency: {
              name: "Matic",
              symbol: "Matic",
              decimals: 18,
            },
            blockExplorerUrls: ["https://explorer-mumbai.maticvigil.com"]
        },
        // Binance chain
        "0x38": {
            chainId: "0x38",
            chainName: "BNB Chain Mainnet",
            rpcUrls: ["https://bsc-dataseed1.ninicoin.io"],
            nativeCurrency: {
              name: "BNB",
              symbol: "BNB",
              decimals: 18,
            },
            blockExplorerUrls: ["https://bscscan.com/"]
        },
        "0x61": {
            chainId: "0x61",
            chainName: "BNB Chain Testnet",
            rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
            nativeCurrency: {
              name: "BNB",
              symbol: "BNB",
              decimals: 18,
            },
            blockExplorerUrls: ["https://testnet.bscscan.com"]
        },
        // Avalanche
        "0xa86a": {
            chainId: "0xa86a",
            chainName: "Avalanche Mainnet",
            rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
            nativeCurrency: {
              name: "AVAX",
              symbol: "AVAX",
              decimals: 18,
            },
            blockExplorerUrls: ["https://snowtrace.io/"]
        },        
        "0xa869": {
            chainId: "0xa869",
            chainName: "Fuji Testnet",
            rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
            nativeCurrency: {
              name: "AVAX",
              symbol: "AVAX",
              decimals: 18,
            },
            blockExplorerUrls: ["https://testnet.snowtrace.io/"]
        },

    },
    LOGO: {
        AVAX: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg',
        BNB: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg',
        Matic: 'https://cryptologos.cc/logos/polygon-matic-logo.svg',
        ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg'
    },
    PRICE_REF_ETH_MAINNET: {
        "0x61": "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
        "0xa869": "0x85f138bfEE4ef8e540890CFb48F620571d67Eda3",
        "0x13881": "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
        "0x5": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        "0xa86a": "0x85f138bfEE4ef8e540890CFb48F620571d67Eda3", 
        "0x38": "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
        "0x89": "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", 
        "0x1": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    },
    MAINNETS: [
      "0xa86a", "0x38", "0x89", "0x1"
    ],
    TESTNETS: {
      "0xa86a": ["0xa869"],
      "0x38": ["0x61"],
      "0x89": ["0x13881"],
      "0x1": ["0x5", "0x2a"]
    },
    FAUCETS: {
      "0xa869": "https://faucet.avax-test.network/",
      "0x61": "https://testnet.binance.org/faucet-smart",
      "0x13881": "https://faucet.polygon.technology/",
      "0x2a": "https://ethdrop.dev/",
      "0x5": "https://goerlifaucet.com/"
    },
    CONTRACTS: {
      marketplace: {
        "0x61": "0x275E6A2aD3598189a2897F5b6af2F54E7cb623eF",
        "0xa869": "0xA05a64Af69AfA088fcd3D0D2f18147B4F21dDb09",
        "0x13881": "0xA05a64Af69AfA088fcd3D0D2f18147B4F21dDb09",
        "0x5": "0xA05a64Af69AfA088fcd3D0D2f18147B4F21dDb09",
        "0xa86a": null, 
        "0x38": null,
        "0x89": null, 
        "0x1": null
      },
      tokenizer: {
        "0x61": null,
        "0xa869": null,
        "0x13881": null,
        "0x5": "0xD193ee256bC69701B5f55c22C4Af58f8e5A84222",
        "0xa86a": null, 
        "0x38": null,
        "0x89": null, 
        "0x1": null
      }
    },
    PREFERENCES: {
      PROVIDER: 'dappifyWalletProvider',
      CHAIN: 'dappifyChain',
      SUBDOMAIN: 'subdomain',
      NETWORK: {
        chainId: null
      }
    },
    SPEEDY_NODE: {
      "0x61": `https://speedy-nodes-nyc.moralis.io/${process.env.REACT_APP_MORALIS_SPEEDY_NODES_KEY}/bsc/testnet`,
      "0xa869": `https://speedy-nodes-nyc.moralis.io/${process.env.REACT_APP_MORALIS_SPEEDY_NODES_KEY}/avalanche/testnet`,
      "0x13881": `https://speedy-nodes-nyc.moralis.io/${process.env.REACT_APP_MORALIS_SPEEDY_NODES_KEY}/polygon/mumbai`,
      "0x5": `https://speedy-nodes-nyc.moralis.io/${process.env.REACT_APP_MORALIS_SPEEDY_NODES_KEY}/eth/goerli`,
      "0xa86a": `https://speedy-nodes-nyc.moralis.io/${process.env.REACT_APP_MORALIS_SPEEDY_NODES_KEY}/avalanche/mainnet`, 
      "0x38": `https://speedy-nodes-nyc.moralis.io/${process.env.REACT_APP_MORALIS_SPEEDY_NODES_KEY}/bsc/mainnet`,
      "0x89": `https://speedy-nodes-nyc.moralis.io/${process.env.REACT_APP_MORALIS_SPEEDY_NODES_KEY}/polygon/mainnet`,
      "0x1": `https://speedy-nodes-nyc.moralis.io/${process.env.REACT_APP_MORALIS_SPEEDY_NODES_KEY}/eth/mainnet`
    }
};

export default constants;