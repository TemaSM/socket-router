/// <reference path="es6-promise.d.ts" />

module SocketRouter {
    export class _Base {
        private _routesTable = {};
        private _callbacks = [];


        route<T> (path : string, handler : ((data?) => Promise<T>) | ((data?, reply? : Reply<T>) => void)) {
            path = path.replace(/\s/g, '').toLowerCase();
            if (typeof this._routesTable[path] !== 'undefined') {
                throw new Error('Route path "' + path + '" already taken');
            }
            this._routesTable[path] = handler;
        }

        listen (socket) {
            socket.on('message', (msg : any) => {
                if (typeof msg !== 'Object' && msg.sr !== 1) return;

                if (typeof msg.replyTo !== 'undefined') {
                    var callback = this._callbacks[msg.replyTo];
                    if (typeof msg.error !== 'undefined') {
                        callback.reject(new Error(msg.error));
                        if (typeof callback.callback !== 'undefined') {
                            callback.callback(new Error(msg.error), null);
                        }
                    } else {
                        callback.resolve(msg.data);
                        if (typeof callback.callback !== 'undefined') {
                            callback.callback(null, msg.data);
                        }
                    }
                    this._callbacks[msg.replyTo] = null;

                    return;
                }

                var handler = this._routesTable[msg.path];
                if (typeof handler === 'undefined') {
                    var starHandler = this._routesTable['*'];
                    if (typeof starHandler !== 'undefined') {
                        this.fireHandler(starHandler,  socket, msg);
                    } else if (typeof msg.replyId !== 'undefined') {
                        this.replyError(socket, msg.replyId, '404 path not found');
                    }
                    return;
                }
                this.fireHandler(handler, socket, msg);
            });
        }

        protected fireHandler (handler, socket, msg) {
            var reply : any = (data) => {
                this.reply(socket, msg.replyId, data);
            };
            reply.error = (error) => {
                this.replyError(socket, msg.replyId, error);
            };
            var h = handler(msg.data, reply);
            if(h instanceof Promise) {
                h.then((data) => {
                    this.reply(socket, msg.replyId, data);
                }).catch((error) => {
                    this.replyError(socket, msg.replyId, error);
                });
            }
        }

        protected reply (socket, replyId, data) {
            this.sendMessage(socket, {
                replyTo: replyId,
                data: data
            });
        }

        protected replyError (socket, replyId, error : Error | string) {
            var errorMsg;
            if (error instanceof Error) errorMsg = error.message;
            if (typeof errorMsg !== 'string' || errorMsg === '') errorMsg = 'Unknown Error';
            this.sendMessage(socket, {
                replyTo: replyId,
                error: errorMsg
            });
        }

        protected queCallback (callback) {
            for (var i = 0; i < this._callbacks.length; i++) {
                if (this._callbacks[i] === null) {
                    this._callbacks[i] = callback;
                    return i;
                }
            }
            this._callbacks.push(callback);
            return this._callbacks.length - 1;
        }

        protected sendMessage (socket, msg) {
            msg.sr = 1;
            socket.send(msg);
        }
    }

    export interface Reply<T> {
        (data? : T) : void
        error(msg : Error | string) : void;
    }

    export class Client extends _Base {
        private _socket = null;

        constructor (socket) {
            super();
            this._socket = socket;
            this.listen(socket);
        }

        send<T> (path : string, data? : any, callback? : (err?, data?) => void) : Promise<T> {
            return new Promise((resolve, reject) => {
                if (this._socket === null) {
                    throw new Error('No socket server');
                }
                var msg : any = {
                    path: path,
                    data: data
                };
                msg.replyId = this.queCallback({ resolve: resolve, reject: reject, callback: callback });
                this.sendMessage(this._socket, msg);
            });
        }
    }

    export class Server extends _Base {
        send<T> (socket, path : string, data? : any, callback? : (err?, data?) => void) : Promise<T> {
            return new Promise((resolve, reject) => {
                var msg : any = {
                    path: path,
                    data: data
                };
                msg.replyId = this.queCallback({ resolve: resolve, reject: reject, callback: callback });
                this.sendMessage(socket, msg);
            });
        }
    }
}

export = SocketRouter;