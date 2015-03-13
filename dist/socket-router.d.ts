declare module SocketRouter {
    class _Base {
        private _routesTable;
        private _callbacks;
        route(path: string, handler: (reply?: Reply<any>, data?) => void): void;
        listen(socket: any): void;
        protected reply(socket: any, replyId: any, data: any): void;
        protected replyError(socket: any, replyId: any, errorMsg: string): void;
        protected queCallback(callback: any): number;
        protected sendMessage(socket: any, msg: any): void;
    }
    interface Reply<T> {
        (data: T): void;
        error(msg: string): void;
    }
    class Client extends _Base {
        private _socket;
        constructor(socket: any);
        send(path: string, data?: any, callback?: (err?, data?) => void): void;
    }
    class Server extends _Base {
        send(socket: any, path: string, data?: any, callback?: (err?, data?) => void): void;
    }
}

declare module "socket-router" {
    export = SocketRouter;
}