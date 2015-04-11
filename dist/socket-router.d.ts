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
        send<T>(path: string, data?: any): Promise<T>;
    }
    class Server extends _Base {
        send<T>(socket: any, path: string, data?: any): Promise<T>;
    }
}

declare module "socket-router" {
    export = SocketRouter;
}