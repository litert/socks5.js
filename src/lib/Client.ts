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

import * as Net from 'node:net';
import * as C from './Common';
import * as Constants from './Constants';
import { SocketControl } from './Utils';

const SOCKS5_VERSION = 0x05;
const AUTH_PWD_PROTOCOL_VERSION = 0x01;

function createSocket(
    host: string,
    port: number,
    timeout: number = Constants.DEFAULT_TIMEOUT
): Promise<Net.Socket> {

    return new Promise((resolve, reject) => {

        const socket = Net.connect({
            'host': host,
            'port': port,
            'timeout': timeout,
        });

        socket.once('connect', () => {
            socket.removeAllListeners();
            resolve(socket);
        });

        socket.once('error', (err) => {
            socket.removeAllListeners();
            reject(err);
        });
    });
}

const CLIENT_GREETING = Buffer.from([
    SOCKS5_VERSION,
    0x02, Constants.EAuthMethod.NONE, Constants.EAuthMethod.USERNAME_PASSWORD
]);

async function stageGreeting(sCtrl: SocketControl): Promise<Constants.EAuthMethod> {

    sCtrl.write(CLIENT_GREETING);

    const SERVER_GREETING = await sCtrl.readPacket();

    if (SERVER_GREETING.length !== 2) {

        throw new Error('Invalid SOCKS5 protocol due to incorrect SERVER_CHOICE packet size');
    }

    if (SERVER_GREETING[0] !== SOCKS5_VERSION) {

        throw new Error('Invalid SOCKS5 protocol due to invalid version in SERVER_CHOICE packet');
    }

    return SERVER_GREETING[1];
}

function createUsernamePasswordAuthPacket(auth: C.IClientAuthOptions): Buffer {

    const lenUsername = Buffer.byteLength(auth.username);
    const lenPassword = Buffer.byteLength(auth.password);

    const packet = Buffer.allocUnsafe(3 + lenUsername + lenPassword);

    packet[0] = AUTH_PWD_PROTOCOL_VERSION;
    packet[1] = lenUsername;
    packet.write(auth.username, 2);
    packet[2 + lenUsername] = lenPassword;
    packet.write(auth.password, 3 + lenUsername);

    return packet;
}

async function stageAuth(
    sCtrl: SocketControl,
    auth: C.IClientAuthOptions | null = null
): Promise<void> {

    if (!auth) {

        throw new Error('SOCKS5 server requires authentication');
    }

    sCtrl.write(createUsernamePasswordAuthPacket(auth));

    const result = await sCtrl.readPacket();

    if (result.length !== 2) {

        throw new Error('Invalid SOCKS5 protocol due to incorrect AUTH_RESPONSE packet size');
    }

    if (result[0] !== 0x01) {

        throw new Error('Invalid SOCKS5 protocol due to invalid version in AUTH_RESPONSE packet');
    }

    if (result[1] !== 0x00) {

        throw new Error('SOCKS5 server rejected authentication');
    }
}

async function handshake(sCtrl: SocketControl, auth: C.IConnectOptions['server']['auth']): Promise<void> {

    const serverAuthMethod = await stageGreeting(sCtrl);

    switch (serverAuthMethod) {

        case Constants.EAuthMethod.NONE:
            break;
        case Constants.EAuthMethod.USERNAME_PASSWORD:
            await stageAuth(sCtrl, auth);
            break;
        default:
        case Constants.EAuthMethod.NO_ACCEPTABLE_METHODS:

            throw new Error('No authentication method accepted by remote server');
    }
}

function createStartProxyPacketByDomain(target: C.IConnectOptions['target']): Buffer {

    const lenDomain = Buffer.byteLength(target.host);

    /**
     * 1 (Ver) + 1 (Cmd) + 1 (Rsv) + 1 (Hostname Type) + 1 (lenDomain) + lenDomain + 2 (Port)
     */
    const packet = Buffer.allocUnsafe(7 + lenDomain);

    packet[0] = SOCKS5_VERSION;
    packet[1] = Constants.ECommand.CONNECT; // CMD_CONNECT
    packet[2] = 0; // RESERVED
    packet[3] = Constants.ETargetHostnameType.DOMAIN; // Hostname Type
    packet[4] = lenDomain; // lenDomain
    packet.write(target.host, 5); // Domain
    packet.writeUInt16BE(target.port, 5 + lenDomain); // Port

    return packet;
}

function createStartProxyPacketByIPv4(target: C.IConnectOptions['target']): Buffer {

    if (!Net.isIPv4(target.host)) {

        throw new Error('Invalid IPv4 address');
    }

    /**
     * 1 (Ver) + 1 (Cmd) + 1 (Rsv) + 1 (Hostname Type) + 4 (IP v4 address) + 2 (Port)
     */
    const packet = Buffer.allocUnsafe(10);
    const netAddr = target.host.split('.');

    packet[0] = SOCKS5_VERSION;
    packet[1] = Constants.ECommand.CONNECT; // CMD_CONNECT
    packet[2] = 0; // RESERVED
    packet[3] = Constants.ETargetHostnameType.IPV4; // Hostname Type
    packet[4] = parseInt(netAddr[0], 10); // IP v4 address
    packet[5] = parseInt(netAddr[1], 10); // IP v4 address
    packet[6] = parseInt(netAddr[2], 10); // IP v4 address
    packet[7] = parseInt(netAddr[3], 10); // IP v4 address
    packet.writeUInt16BE(target.port, 8); // Port

    return packet;
}

function parseIPv6(addr: string): number[] {

    if (!Net.isIPv6(addr)) {

        throw new Error('Invalid IPv6 address');
    }

    const netAddr = addr.split(':');
    const result = [];

    for (let i = 0; i < netAddr.length; i++) {

        const part = netAddr[i];

        if (part === '') {

            netAddr.splice(i, 1);
            netAddr.splice(i, netAddr.length - 8, ...Array(8 - netAddr.length).fill('0'));
            result.push(0);
        }
        else {

            result.push(parseInt(part, 16));
        }
    }

    return result;
}

function createStartProxyPacketByIPv6(target: C.IConnectOptions['target']): Buffer {

    if (!Net.isIPv6(target.host)) {

        throw new Error('Invalid IPv6 address');
    }

    /**
     * 1 (Ver) + 1 (Cmd) + 1 (Rsv) + 1 (Hostname Type) + 16 (IP v6 address) + 2 (Port)
     */
    const packet = Buffer.allocUnsafe(22);
    const netAddr = parseIPv6(target.host);

    packet[0] = SOCKS5_VERSION;
    packet[1] = Constants.ECommand.CONNECT; // CMD_CONNECT
    packet[2] = 0; // RESERVED
    packet[3] = Constants.ETargetHostnameType.IPV6; // Hostname Type

    for (let i = 0; i < 8; i++) {

        packet[4 + i * 2] = netAddr[i] >> 8;
        packet[5 + i * 2] = netAddr[i] & 0xFF;
    }

    packet.writeUInt16BE(target.port, 20); // Port

    return packet;
}

function createStartProxyPacket(target: C.IConnectOptions['target']): Buffer {

    switch (target.type) {
        case Constants.ETargetHostnameType.DOMAIN:
            return createStartProxyPacketByDomain(target);
        case Constants.ETargetHostnameType.IPV4:
            return createStartProxyPacketByIPv4(target);
        case Constants.ETargetHostnameType.IPV6:
            return createStartProxyPacketByIPv6(target);
        default:

            /**
             * Detect the type automatically if omitted
             */
            if (Net.isIPv4(target.host)) {

                return createStartProxyPacketByIPv4(target);
            }

            if (Net.isIPv6(target.host)) {

                return createStartProxyPacketByIPv6(target);
            }

            return createStartProxyPacketByDomain(target);
    }
}

async function startProxy(sCtrl: SocketControl, target: C.IConnectOptions['target']): Promise<void> {

    const reqPacket = createStartProxyPacket(target);

    sCtrl.write(reqPacket);

    const packet = await sCtrl.readPacket(true);

    if (packet.length < 5) {

        throw new Error('Invalid SOCKS5 protocol due to invalid packet length');
    }

    if (packet[0] !== SOCKS5_VERSION) {

        throw new Error('Invalid SOCKS5 protocol due to invalid version');
    }

    if (packet[1] !== Constants.ECommandReply.SUCCEEDED) {

        throw new Error(`Failed to connect to target with error code "${Constants.ECommandReply[packet[1]]}".`);
    }
}

/**
 * Create a socket that connects to target `host:port` through determined SOCKS5 proxy server.
 *
 * > The socket is not configured with 30s `timeout` by default, you can set it manually.
 * >
 * > Except for `timeout`, all other options are the same as `node:net` module does.
 * >
 * > Besides, you should notice that `address()` does not refer to the target `host:port`, but the proxy server's `host:port`.
 *
 * @returns A normal socket provided by `node:net` module, and it is already connected to target `host:port`, though a SOCKS5 proxy server.
 */
export async function connect(options: C.IConnectOptions): Promise<Net.Socket> {

    const sControl = new SocketControl(await createSocket(
        options.server.host,
        options.server.port,
        options.server.connectTimeout,
    ));

    sControl.socket.setTimeout(options.server.handshakeTimeout ?? Constants.DEFAULT_TIMEOUT);

    try {

        await handshake(sControl, options.server.auth);

        await startProxy(sControl, options.target);

        return sControl.socket;
    }
    catch (e) {

        sControl.killSocket();
        throw e;
    }
}
