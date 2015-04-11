var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

var SocketRouter;
;!function(SocketRouter) {
    var _Base = (function () {
        function _Base() {
            this._routesTable = {};
            this._callbacks = [];
        }
        _Base.prototype.route = function (path, handler) {
            path = path.replace(/\s/g, '').toLowerCase();
            if (typeof this._routesTable[path] !== 'undefined') {
                throw new Error('Route path "' + path + '" already taken');
            }
            this._routesTable[path] = handler;
        };
        _Base.prototype.listen = function (socket) {
            var _this = this;
            socket.on('message', function (msg) {
                if (typeof msg !== 'Object' && msg.sr !== 1)
                    return;
                if (typeof msg.replyTo !== 'undefined') {
                    if (typeof msg.error !== 'undefined') {
                        _this._callbacks[msg.replyTo].reject(new Error(msg.error));
                    }
                    else {
                        _this._callbacks[msg.replyTo].resolve(msg.data);
                    }
                    _this._callbacks[msg.replyTo] = null;
                    return;
                }
                var reply, handler = _this._routesTable[msg.path];
                if (typeof msg.replyId !== 'undefined') {
                    reply = function (data) {
                        _this.reply(socket, msg.replyId, data);
                    };
                    reply.error = function (msg) {
                        _this.replyError(socket, msg.replyId, msg);
                    };
                }
                if (typeof handler === 'undefined') {
                    var starHandler = _this._routesTable['*'];
                    if (typeof starHandler !== 'undefined') {
                        starHandler(reply, msg.data);
                    }
                    else if (typeof msg.replyId !== 'undefined') {
                        _this.replyError(socket, msg.replyId, '404 path not found');
                    }
                    return;
                }
                handler(reply, msg.data);
            });
        };
        _Base.prototype.reply = function (socket, replyId, data) {
            this.sendMessage(socket, {
                replyTo: replyId,
                data: data
            });
        };
        _Base.prototype.replyError = function (socket, replyId, errorMsg) {
            this.sendMessage(socket, {
                replyTo: replyId,
                error: errorMsg
            });
        };
        _Base.prototype.queCallback = function (callback) {
            for (var i = 0; i < this._callbacks.length; i++) {
                if (this._callbacks[i] === null) {
                    this._callbacks[i] = callback;
                    return i;
                }
            }
            this._callbacks.push(callback);
            return this._callbacks.length - 1;
        };
        _Base.prototype.sendMessage = function (socket, msg) {
            msg.sr = 1;
            socket.send(msg);
        };
        return _Base;
    })();
    SocketRouter._Base = _Base;
    var Client = (function (_super) {
        __extends(Client, _super);
        function Client(socket) {
            _super.call(this);
            this._socket = null;
            this._socket = socket;
            this.listen(socket);
        }
        Client.prototype.send = function (path, data) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                if (_this._socket === null) {
                    throw new Error('No socket server');
                }
                var msg = {
                    path: path,
                    data: data
                };
                msg.replyId = _this.queCallback({ resolve: resolve, reject: reject });
                _this.sendMessage(_this._socket, msg);
            });
        };
        return Client;
    })(_Base);
    SocketRouter.Client = Client;
    var Server = (function (_super) {
        __extends(Server, _super);
        function Server() {
            _super.apply(this, arguments);
        }
        Server.prototype.send = function (socket, path, data) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var msg = {
                    path: path,
                    data: data
                };
                msg.replyId = _this.queCallback({ resolve: resolve, reject: reject });
                _this.sendMessage(socket, msg);
            });
        };
        return Server;
    })(_Base);
    SocketRouter.Server = Server;

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(function() {
            return SocketRouter;
        });
    } else if (typeof module === 'object') {
        // CommonJS
        module.exports = SocketRouter;
    }
    else {
        // Browser global.
        window.SocketRouter = SocketRouter;
    }
}(SocketRouter || (SocketRouter = {}));