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

import type * as Constants from './Constants';

export interface IClientAuthOptions {

    /**
     * The username to authenticate with the socks server.
     */
    username: string;

    /**
     * The password to authenticate with the socks server.
     */
    password: string;
}

export interface IServerConnectOptions {

    /**
     * The hostname of the socks server.
     */
    host: string;

    /**
     * The port of the socks server.
     *
     * @default 1080
     */
    port?: number;

    /**
     * The timeout during connecting to the socks server.
     *
     * @default 30000
     */
    connectTimeout?: number;

    /**
     * The timeout during connecting to the socks server.
     *
     * @default 30000
     */
    handshakeTimeout?: number;

    /**
     * The optional authentication options of the socks server.
     *
     * @default null
     */
    auth?: IClientAuthOptions | null;
}

export interface IConnectOptions {

    server: IServerConnectOptions | string;

    target: {

        /**
         * The type of target host.
         *
         * > If not set, it will automatically detect the type of target host.
         */
        type?: Constants.ETargetHostnameType;

        /**
         * The hostname of target host to be connected through remote socks server.
         */
        host: string;

        /**
         * The port of destination host to be connected through remote socks server.
         */
        port: number;
    };
}
