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
import * as Http from 'node:http';

const TEST_DOMAIN = 'fenying.net';

(async () => {

    if (!process.env['http_proxy']) {

        throw new Error('Please set environment variable "http_proxy".');
    }

    const socket = await Socks5.connect({
        'server': process.env['http_proxy']!,
        'target': {
            'host': TEST_DOMAIN,
            'port': 80
        }
    });

    const req = Http.request({
        'host': TEST_DOMAIN,
        'port': 80,
        'method': 'GET',
        'path': '/',
        'createConnection': () => socket
    });

    const [resp, body] = await new Promise<[Http.IncomingMessage, Buffer]>((resolve, reject) => {

        req.on('error', (e) => {

            req.removeAllListeners();
            reject(e);
        });

        const buf: Buffer[] = [];

        req.on('response', (resp) => {

            resp.on('data', (d) => {

                buf.push(d);
            });

            resp.on('end', () => {

                req.removeAllListeners();
                resolve([resp, Buffer.concat(buf)]);
            });
        });

        req.end();
    });

    console.log(resp.statusCode);

    console.log(body.toString());

})().catch(e => {

    console.error(e);
});
