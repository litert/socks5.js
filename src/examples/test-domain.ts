/**
 * Copyright 2023 Angus.Fenying <fenying@litert.org>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Socks5 from '../lib';
import * as TLS from 'node:tls';

const TEST_DOMAIN = 'fenying.net';

(async () => {

    for (const key of ['lrt_socks5_host', 'lrt_socks5_port']) {

        if (!process.env[key]) {

            throw new Error(`Please set environment variable ${key}`);
        }
    }

    const socket = TLS.connect({
        'host': TEST_DOMAIN,
        'port': 443,
        'servername': TEST_DOMAIN,
        'socket': await Socks5.connect({
            'server': {
                'host': process.env['lrt_socks5_host']!,
                'port': parseInt(process.env['lrt_socks5_port']!),
                'auth': process.env['lrt_socks5_username'] && process.env['lrt_socks5_password'] ?
                    {
                        'username': process.env['lrt_socks5_username'],
                        'password': process.env['lrt_socks5_password']
                    } :
                    null
            },
            'target': {
                // 'type': Socks5.Constants.ETargetHostnameType.DOMAIN,
                'host': TEST_DOMAIN,
                'port': 443
            }
        })
    });

    await new Promise((resolve, rejects) => socket.once('secureConnect', resolve).once('error', rejects));

    const client = new Socks5.Utils.SocketControl(socket);

    client.write(Buffer.from('GET / HTTP/1.1\r\nHost: www.google.com\r\n\r\n'));

    while (1) {

        console.log((await client.readPacket()).toString());
    }

})().catch(e => {

    console.error(e);
});
