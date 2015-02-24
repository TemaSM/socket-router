# Socket Router
Simple Socket Routing

## Install
    $ npm install socket-router --save
    $ bower install socket-router --save

##  Usage

### Server
    // Basic Socket Wrapper
    var EventEmitter = require('events').EventEmitter;
    function Socket(ws) {
        EventEmitter.call(this);
        this._ws = ws;
        ws.on('message', this.msg.bind(this));
    }
    Socket.prototype = Object.create(EventEmitter.prototype);
    Socket.prototype.msg = function (data) {
        this.emit('message', JSON.parse(data));
    };
    Socket.prototype.send = function (data) {
        this._ws.send(JSON.stringify(data));
    };
    // End Basic Socket Wrapper

    var server = new SocketRouting.Server();

    // Catch All routes
    server.route('*', function() {
        console.log("Oh.");
    });

    server.route('hello', function(reply, data) {
        console.log(data);
        reply({ foo: "YAY"});
    });

    wss.on('connection', function connection (ws) {
        server.listen(new Socket(ws));
    });

## Client

    // Basic Socket Wrapper
    function Socket(ws) {
        EventEmitter.call(this);
        this._ws = ws;
        ws.addEventListener('message', this.msg.bind(this));
    }
    Socket.prototype = Object.create(EventEmitter.prototype);
    Socket.prototype.msg = function (e) {
        this.emit('message', JSON.parse(e.data));
    };
    Socket.prototype.send = function (data) {
        this._ws.send(JSON.stringify(data));
    };
    // End Basic Socket Wrapper

    var ws = new WebSocket('ws://localhost:1337');

    var server = new SocketRouting.Client(new Socket(ws));

    server.send('hello', { part : "WHOO" }, function(data) {
    	console.log("YAY", data);
    });
