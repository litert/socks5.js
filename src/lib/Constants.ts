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

export enum EAuthMethod {
    NONE = 0x00,
    USERNAME_PASSWORD = 0x02,
    NO_ACCEPTABLE_METHODS = 0xFF,
}

/**
 * The default timeout for sockets.
 */
export const DEFAULT_TIMEOUT = 30_000;

export enum ETargetHostnameType {
    IPV4 = 0x01,
    DOMAIN = 0x03,
    IPV6 = 0x04,
}

export enum ECommand {
    CONNECT = 0x01,
}

export enum ECommandReply {
    SUCCEEDED = 0x00,
    GENERAL_SOCKS_SERVER_FAILURE = 0x01,
    CONNECTION_NOT_ALLOWED_BY_RULE_SET = 0x02,
    NETWORK_UNREACHABLE = 0x03,
    HOST_UNREACHABLE = 0x04,
    CONNECTION_REFUSED = 0x05,
    TTL_EXPIRED = 0x06,
    COMMAND_NOT_SUPPORTED = 0x07,
    ADDRESS_TYPE_NOT_SUPPORTED = 0x08,
}
