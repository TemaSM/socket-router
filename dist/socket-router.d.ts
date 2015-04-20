declare module SocketRouter {
    class _Base {
        route<T>(path: string, handler: ((data?) => Promise<T>) | ((data?, reply?: Reply<T>) => void)): void;
        listen(socket: any): void;
    }
    interface Reply<T> {
        (data?: T): void;
        error(msg: Error | string): void;
    }
    class Client extends _Base {
        private _socket;
        constructor(socket: any);
        send<T>(path: string, data?: any, callback?: (err?, data?) => void): Promise<T>;
    }
    class Server extends _Base {
        send<T>(socket: any, path: string, data?: any, callback?: (err?, data?) => void): Promise<T>;
    }
}

declare module "socket-router" {
    export = SocketRouter;
}