declare module "socket-router" {
    class _Base {
        private _routesTable;
        private _callbacks;
        route(path: string, handler: (data?, reply?: Reply) => void): void;
        listen(socket: any): void;
        protected reply(socket: any, replyId: any, data: any): void;
        protected queCallback(callback: any): number;
        protected sendMessage(socket: any, msg: any): void;
    }
    interface Reply {
        (data: any): any;
    }
    class Client extends _Base {
        private _socket;
        constructor(socket: any);
        send(path: string, data?: Object, callback?: (err?, data?) => {}): void;
    }
    class Server extends _Base {
        send(socket: any, path: string, data?: Object, callback?: (err?, data?) => {}): void;
    }
}
declare module "socket-router" {
    export = SocketRouter;
}