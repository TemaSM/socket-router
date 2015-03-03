module SocketRouter {
    export class _Base {
        private _routesTable = {};
        private _callbacks = [];


        route(path : string, handler : (reply? : Reply, data?) => void){
            path = path.replace(/\s/g, '').toLowerCase();
            if(typeof this._routesTable[path] !== 'undefined') {
                throw new Error('Route path "' + path + '" already taken');
            }
            this._routesTable[path] = handler;
        }

        listen(socket){
            socket.on('message', (msg : any) => {
                if(typeof msg !== 'Object' && msg.sr !== 1) return;

                if(typeof msg.replyTo !== 'undefined') {
                    if(typeof msg.error !== 'undefined') {
                        this._callbacks[msg.replyTo](new Error(msg.error));
                    } else {
                        this._callbacks[msg.replyTo](null, msg.data);
                    }
                    this._callbacks[msg.replyTo] = null;
                    return;
                }

                var reply, handler = this._routesTable[msg.path];
                if(typeof msg.replyId !== 'undefined') {
                    reply = (data) => {
                        this.reply(socket, msg.replyId, data);
                    };
                    reply.error = (msg) => {
                        this.replyError(socket, msg.replyId, msg);
                    };
                }
                if(typeof handler === 'undefined') {
                    var starHandler = this._routesTable['*'];
                    if(typeof starHandler !== 'undefined') {
                        starHandler(reply, msg.data);
                    } else if(typeof msg.replyId !== 'undefined') {
                        this.replyError(socket, msg.replyId, '404 path not found');
                    }
                    return;
                }
                handler(reply, msg.data);
            });
        }

        protected reply(socket, replyId, data) {
            this.sendMessage(socket, {
                replyTo: replyId,
                data: data
            });
        }

        protected replyError(socket, replyId, errorMsg : string) {
            this.sendMessage(socket, {
                replyTo: replyId,
                error: errorMsg
            });
        }

        protected queCallback(callback) {
            for (var i = 0; i < this._callbacks.length; i++) {
                if(this._callbacks[i] === null) {
                    this._callbacks[i] = callback;
                    return i;
                }
            }
            this._callbacks.push(callback);
            return this._callbacks.length - 1;
        }

        protected sendMessage(socket, msg) {
            msg.sr = 1;
            socket.send(msg);
        }
    }

    export interface Reply {
        (data : any)
        error(msg : string);
    }

    export class Client extends _Base {
        private _socket = null;

        constructor(socket) {
            super();
            this._socket = socket;
            this.listen(socket);
        }

        send(path : string, data? : any, callback? : (err?, data?) => void) {
            if(this._socket === null) {
                throw new Error('No socket server');
            }
            var msg : any = {
                path: path,
                data: data
            };
            if(callback) {
                msg.replyId = this.queCallback(callback);
            }
            this.sendMessage(this._socket, msg);
        }
    }

    export class Server extends _Base {
        send(socket, path : string, data? : any, callback? : (err?, data?) => void) {
            var msg : any = {
                path: path,
                data: data
            };
            if(callback) {
                msg.replyId = this.queCallback(callback);
            }
            this.sendMessage(socket, msg);
        }
    }
}

export = SocketRouter;