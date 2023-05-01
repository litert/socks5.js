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
import * as Http2 from 'node:http2';

const TEST_DOMAIN = 'fenying.net';

(async () => {

    if (!process.env['http_proxy']) {

        throw new Error('Please set environment variable "http_proxy".');
    }

    const tcpSocket = await Socks5.connect({
        'server': process.env['http_proxy']!,
        'target': {
            'host': TEST_DOMAIN,
            'port': 443
        }
    });

    /**
     * The created socket over HTTP proxy server is a plain socket, so that here we need to
     * upgrade it to a TLS socket.
     */
    const tlsSocket = TLS.connect({
        'servername': TEST_DOMAIN,
        'ALPNProtocols': ['h2'],
        'socket': tcpSocket
    });

    /**
     * Wait for TLS handshake to be done.
     */
    await new Promise((resolve, reject) => {

        tlsSocket.on('error', (e) => {
            tlsSocket.removeAllListeners();
            tlsSocket.destroy();
            reject(e);
        });

        tlsSocket.on('secureConnect', () => {
            tlsSocket.removeAllListeners();
            resolve(true);
        });
    });

    const connection = Http2.connect('https://fenying.net', {
        createConnection: () => tlsSocket
    });

    await new Promise((resolve, reject) => {

        connection.on('error', (e) => {
            connection.removeAllListeners();
            connection.close();
            reject(e);
        });

        connection.on('connect', () => {
            connection.removeAllListeners();
            resolve(true);
        });
    });

    const [headers, body] = await new Promise<[Record<string, any>, Buffer]>((resolve, reject) => {

        const buf: Buffer[] = [];

        const req = connection.request({
            ':method': 'GET',
            ':path': '/'
        });

        req.on('response', (headers) => {

            req.on('data', (d) => {

                buf.push(d);
            });

            req.on('end', () => {

                req.removeAllListeners();
                resolve([headers, Buffer.concat(buf)]);
            });
        });

        req.on('error', (e) => {

            req.removeAllListeners();
            reject(e);
        });

        req.end();
    });

    console.log(headers);

    console.log(body.toString());

    connection.close();

})().catch(e => {

    console.error(e);
});
