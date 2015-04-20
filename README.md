# Socket Router
Easily route communication over socket connection.  
Module supports both standard socket connections and WebSockets.   
Module also allows routes to optionally reply to messages received from clients. 
Support for es6 Promises

## Install
    $ npm install socket-router --save
    $ bower install socket-router --save

## API
// TODO: Better docs
### Server

#### server.***listen*** ( socket )

#### server.***route*** ( path, callback( data, reply ) )

#### server.***send*** ( socket, path, callback( data, reply ) )

### Client

#### server.***listen*** ( socket )

#### server.***route*** ( path, callback( data, reply ) )

#### server.***send*** ( path, callback( data, reply ) )

### Reply ( data )


##  Usage

### Example 1: Node Server to Node Server Communication

In this example uses [json-socket](https://www.npmjs.com/package/json-socket) to convert the stream to JSON.

#### Host Server

```javascript
var net = require('net');
var JsonSocket = require('json-socket');
var SocketRouter = require('socket-router');

var server = new SocketRouter.Server();
var socketServer = net.createServer();

socketServer.listen(3000);

JsonSocket.prototype.send = JsonSocket.prototype.sendMessage; //TODO: Hack :/

socketServer.on('connection', function (socket) {
    server.listen(new JsonSocket(socket));
});

server.route('addition', function(data, reply) {
    console.log(data);
    reply({ result: data.a + data.b });
});
```


#### Client Server

```javascript
var net = require('net');
var JsonSocket = require('json-socket');
var SocketRouter = require('socket-router');

var socketServer = new JsonSocket(new net.Socket());
socketServer.connect(3000, '127.0.0.1');

JsonSocket.prototype.send = JsonSocket.prototype.sendMessage; //TODO: Hack :/

var server = new SocketRouter.Client(socketServer);

server.send('addition', { a: 4, b: 8 }, function(err, data) {
    if(err) throw err;
    console.log("Answer:", data.result);
});
```


### Example 2: Node Server to Browser Client Communication 

In this example using our own basic JSON Socket Wrapper to convert the stream to JSON and back to stream again.

#### Server

```javascript
// Basic JSON Socket Wrapper
var EventEmitter = require('events').EventEmitter;
function JSONSocketWrapper(ws) {
    EventEmitter.call(this);
    this._ws = ws;
    ws.on('message', this.msg.bind(this));
}
JSONSocketWrapper.prototype = Object.create(EventEmitter.prototype);
JSONSocketWrapper.prototype.msg = function (data) {
    this.emit('message', JSON.parse(data));
};
JSONSocketWrapper.prototype.send = function (data) {
    this._ws.send(JSON.stringify(data));
};
// End Basic Socket Wrapper

var WebSocketServer = require('ws');

var wss = new WebSocketServer.Server({ port: 3000 });
var server = new SocketRouting.Server();

// Catch All routes
server.route('*', function() {
    console.log("Oh.");
});

server.route('addition', function(data, reply) {
    console.log(data);
    reply({ result: data.a + data.b });
});

wss.on('connection', function connection (ws) {
    server.listen(new JSONSocketWrapper(ws));
});
```

#### Client

```javascript
// Basic JSON Socket Wrapper
function JSONSocketWrapper(ws) {
    EventEmitter.call(this);
    this._ws = ws;
    ws.addEventListener('message', this.msg.bind(this));
}
JSONSocketWrapper.prototype = Object.create(EventEmitter.prototype);
JSONSocketWrapper.prototype.msg = function (e) {
    this.emit('message', JSON.parse(e.data));
};
JSONSocketWrapper.prototype.send = function (data) {
    this._ws.send(JSON.stringify(data));
};
// End Basic Socket Wrapper

var ws = new WebSocket('ws://localhost:3000');
var server = new SocketRouting.Client(new JSONSocketWrapper(ws));

server.send('addition', { a: 4, b: 8 }, function(err, data) {
    if(err) throw err;
    console.log("Answer:", data.result);
});
```