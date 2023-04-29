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

import type * as Net from 'node:net';

interface IPromiseControl {

    resolve: (value: Buffer) => void;

    reject: (reason?: any) => void;
}

export class SocketControl {

    private readonly _buffers: Buffer[] = [];

    private _promiseControl: IPromiseControl | null = null;

    private _closeOnData: boolean = false;

    public constructor(
        public readonly socket: Net.Socket,
    ) {

        this.socket
            .on('data', (d) => {

                if (this._closeOnData) {

                    this.stopProxy();
                }

                if (this._promiseControl) {

                    this._promiseControl.resolve(d);
                    this._promiseControl = null;
                }
                else {

                    this._buffers.push(d);
                }
            })
            .on('close', (e) => {

                this._promiseControl?.reject(e || new Error('Socket closed'));
            });
    }

    public readPacket(closeAfterRead: boolean = false): Promise<Buffer> {

        this._closeOnData = closeAfterRead;

        if (this._promiseControl) {

            throw new Error('Cannot read while there is a pending read');
        }

        if (!this._buffers.length) {

            const ret = new Promise<Buffer>((resolve, reject) => {

                this._promiseControl = { resolve, reject };
            });

            return ret;
        }

        return Promise.resolve(this._buffers.shift()!);
    }

    public write(data: Buffer): void {

        this.socket.write(data);
    }

    public killSocket(): void {

        this.stopProxy();
        this.socket.destroy();
    }

    public stopProxy(): void {

        this.socket.removeAllListeners();
    }
}
