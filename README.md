# react-dappify

> Made with create-react-library

[![NPM](https://img.shields.io/npm/v/react-dappify.svg)](https://www.npmjs.com/package/react-dappify) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-dappify
```

## Usage

```jsx
import { DappifyProvider } from 'react-dappify';

const App = () => {

    return (
        <DappifyProvider>
            {...}
        </DappifyProvider>
    );
};

export default App;
```

Relies on the following environment variables
```
REACT_APP_MORALIS_APP_ID=<ID>
REACT_APP_MORALIS_SERVER_URL=<URL>
REACT_APP_ROADMAP_URL=<URL>
REACT_APP_MICROPAPER_URL=<URL>
REACT_APP_CHANGELOG_URL=<URL>
REACT_APP_API_BASE_URL=<URL>
REACT_APP_HOST_ENV=<ENV_SUBDOMAIN>
```

## License

MIT © [gianksp](https://github.com/gianksp)
