# PostRPC

Implements JSON RPC v2 protocol over window.postMessage transport providing sandboxed iFrames a secure/restricted communication mechanism.

In addition to responding to registered RCP's, the server can publish notifications to clients.  Clients can subscribe to notifications they are interested in.

PostRPC is distributed as two separate javascript bundles. One for the server, and one for the client.  Bundles are in Universal Module Definition (UMD) format and should work in most modern browsers.

![Example](/example.png?raw=true "Example with Logging")


## PostRPC.Server

The server library needs to be loaded into the parent window. Once the page is loaded (DOM loaded and parsed), you would instantiate a server instance with the domain that both the parent window and child iFrame windows are loaded from:

```
var server = new window.PostRPC.Server('http://localhost:5001');

```

In order to respond to client RPC requests, the server must register each RCP method, describing its parameters and return, and associate it with the function that performs the actual work:

```
server.register('add', {a: 'Number', b: 'Number'}, 'Number', add);

server.register('multiply', {a: 'Number', b: 'Number'}, 'Number', multiply);
```

After all RPC's are register, you must start the server, so that it begins handling postMessage events on the parent window:

```
server.start();
```

Once the server has started, it wil process valid client requests for any registered RPC.

At any time while the server is running, it may optionally publish notifications to clients running in child iframes:

```
server.publish('something', {stuff: 'Of interest if anyone cares'});
```

You may optional enable server logging to console for debugging client/server communication:

```
server.logging(true);
```

## PostRPC.Client

The clientlibrary needs to be loaded into each child iFrame window in order to make RPC calls or listen to server notifications.  Once the iFrame is loaded (DOM loaded and parsed), you would instantiate a client instance with the domain that both the parent window and child iFrame windows are loaded from:

```
var client = new window.PostRPC.Client('http://localhost:5001');
```


After the client is instantiated, you must start the client, so that it begins handling postMessage events on the child iFrame window:

```
client.start();
```

Now the client may call registered RPC's on the server:

```
client.call('add', {a: 2, b: 2}, function(response) {
 	display(response);
});
```

At any time while the client is running, it may optionally subscribe to notifications from the server running in the parent window:

```
client.subscribe('changed', function(response) {
	display(null, response);
});
```

When notifications are broadcast, subscribing clients will have their callback invoked with the notification response.

You may optional enable client logging to console for debugging client/server communication:

```
client.logging(true);
```

