# LiteRT/Socks5

[![Strict TypeScript Checked](https://badgen.net/badge/TS/Strict "Strict TypeScript Checked")](https://www.typescriptlang.org)
[![npm version](https://img.shields.io/npm/v/@litert/socks5.svg?colorB=brightgreen)](https://www.npmjs.com/package/@litert/socks5 "Stable Version")
[![License](https://img.shields.io/npm/l/@litert/socks5.svg?maxAge=2592000?style=plastic)](https://github.com/litert/socks5.js/blob/master/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/litert/socks5.js.svg)](https://github.com/litert/socks5.js/issues)
[![GitHub Releases](https://img.shields.io/github/release/litert/socks5.js.svg)](https://github.com/litert/socks5.js/releases "Stable Release")

The socks5 protocol library for LiteRT.

> Currently, only client-side CONNECT is supported.

## Installation

```sh
npm install @litert/socks5 --save
```

## Usage

```ts
import * as Socks5 from '@litert/socks5';

(async () => {

    const socket = await Socks5.connect({
        'server': {
            'host': '127.0.0.1', // hostname of socks5 server
            'port': 1080, // port of socks5 server
            'auth': { // optional auth info, set to null or omit it if unnecessary
                'username': 'user1',
                'password': 'my-password'
            }
        },
        'target': {
            /**
             * The type of hostname is optional.
             *
             * If omitted, the lib will detect it automatically
             */
            // 'type': Socks5.Constants.ETargetHostnameType.IPV4,
            'host': '1.1.1.1', // Or a domain
            'port': 443,
        }
    });

    // now a socket connected to 1.1.1.1:443 through socks5 server 127.0.0.1:1080 is created and ready.
    // feel free to use it.

})();
```

## Requirements

- Node.js v14.x (Or newer)
- TypeScript v5.0.x (Or newer)

## License

This library is published under [Apache-2.0](./LICENSE) license.
