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

### Registering RPC's

In order to respond to client RPC requests, the server must register each RCP method, describing it and binding it to a function:

```
server.register('add',[['a', 'Number'], ['b', 'Number']], 'Number', add, 'Calculate the sum of two numbers');

server.register('subtract', [['a', 'Number'], ['b', 'Number']], 'Number', subtract, 'Calculate the difference between two numbers');

server.register('multiply', [['a', 'Number'], ['b', 'Number']], 'Number', multiply, 'Calculate the product of two numbers');

server.register('divide', [['a', 'Number'], ['b', 'Number']], 'Number', divide, 'Calculate the divsion of two numbers');

server.register('digits', [['num', 'Number'], ['n', 'Number']], 'Number', digits, 'Set the precicion for a number');

server.register('getForms', [['version', 'Number'], ['workspaceID', 'Number']], 'Array', getForms, 'Get a list of forms for a workspace');

server.register('getRecords', [['version', 'Number'], ['formID', 'Number']], 'Array', getRecords, 'Get a batch of record for a form');

server.register('getWithConfig', [['config', 'Object'], ['id', 'Number']], 'Array', getRecords, 'Get a thing with config');
```

The *register* method takes three parameters. First is the name of the RPC method. The second is an array describing the parameters required by the RPC. The third parameter describes the RPC return type. The final parameter is the function in the servers namespace that performs the work of the RPC.

Supported parameter and return types include:

| Type          |
| ------------- |
| Boolean       |
| Null          |
| Undefined     |
| Number        |
| String        |
| Object        |
| Array         |

If the return type is an object it may contain members that correspond to any of the other return types (except Promise). It may also contain nested members. It must not, however, contain any self-referential members as it would not be serializable.

The registered function may if needed return a promise to PostRPC.Server when called. If so, it must resolve or reject to the actual result/error. The promise itself is not sent through postMessage transport as it and it's resolve/reject handlers are not serializable. The promise will be held by PostRPCServer until it resolves/rejects and the corresponding result/error will be forwarded through postMessage to PostRPC.Client.

### Starting the Server

After all RPC's are register, you must start the server, so that it begins handling postMessage events on the parent window:

```
server.start();
```

### Publishing Notifications

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

Installation:

```
$ npm i @zenginehq/post-rpc-client
```

The library is delivered in UMD, so it is available in your project via

```
import { Client } from '@zenginehq/post-rpc-client';
```

or

```
const Client = window.PostRPC.Client;
```

The client library needs to be loaded into each child iFrame window in order to make RPC calls or listen to server notifications.  Once the iFrame is loaded (DOM loaded and parsed), you would instantiate a client instance with the domain that the parent window is loaded from:

```
const client = new Client('http://localhost:5001');
```

### Starting the Client

After the client is instantiated, you must start the client, so that it begins handling postMessage events on the child iFrame window:

```
client.start();
```

### Calling RPC's

Now the client may call registered RPC's on the server:

```
client.call('add', {a: 2, b: 2}, function(result, error) {
 	display('add 2 + 2', result, error);
});
```

If prefered, you can work with promises instead:

```
client.call('subtract', {a: 11, b: -8})
.then(function(result) {
	display('subtract 11 - -8', result, null);
})
.catch(function(error) {
	display('subtract 11 - -8', null, error);
});
```

### Subscribing to Notifications

At any time while the client is running, it may optionally subscribe to notifications from the server running in the parent window:

```
client.subscribe('changed', function(result, error) {
	display(result, error);
});
```

When notifications are broadcast, subscribing clients will have their callback invoked with the notification response.

You may optional enable client logging to console for debugging client/server communication:

```
client.logging(true);
```

## Generating stubs from Interface Definitions

Client and server stubs can be generated using an interface defition file (yaml).

Installation:

```
$ npm i [-g] @zenginehq/post-rpc-generator
```

example.yml:
```
---
# Top level array of services
- description: Person service
  object: person # optional, functions as members of object
  functions: # Array of funtions
  - function: create # Function name
    args: # Array of arguments for function
    - arg: first # Argument name
      type: Number # Argument type
    - arg: last # Argument name
      type: Number # Argument type
    return: Number # Return type
    description: Create person # Function description
  - function: update
    args:
    - arg: first
      type: Number
    - arg: last
      type: Number
    return: Number
    description: Update person
  - function: delete
    args:
    return: Number
    description: Delete person
- description: Math service
  object:
  functions:
  - function: add
    args:
    - arg: a
      type: Number
    - arg: b
      type: Number
    return: Number
    description: Calculate the sum of two numbers
  - function: subtract
    args:
    - arg: a
      type: Number
    - arg: b
      type: Number
    return: Number
    description: Calculate the difference between two numbers
  - function: multiply
    args:
    - arg: a
      type: Number
    - arg: b
      type: Number
    return: Number
    description: Calculate the product of two numbers
  - function: divide
    args:
    - arg: a
      type: Number
    - arg: b
      type: Number
    return: Number
    description: Calculate the divsion of two numbers
  - function: digits
    args:
    - arg: num
      type: Number
    - arg: n
      type: Number
    return: Number
    description: Set the precicion for a number
  - function: getForms
    args:
    - arg: version
      type: Number
    - arg: workspaceID
      type: Number
    return: Array
    description: Get a list of forms for a workspace
  - function: getRecords
    args:
    - arg: version
      type: Number
    - arg: formID
      type: Number
    return: Array
    description: Get a batch of record for a form
  - function: getWithConfig
    args:
    - arg: config
      type: Object
    - arg: id
      type: Number
    return: Array
    description: Get a thing with config
```

Generating:

```
$ generate example.yml
```

Will produce server and server stubs:

example.server.js:

```
  // Person service
  //
  window.server.register('person.create', [['first', 'Number'], ['last', 'Number']], 'Number', person.create, 'Create person');
  window.server.register('person.update', [['first', 'Number'], ['last', 'Number']], 'Number', person.update, 'Update person');
  window.server.register('person.delete', [], 'Number', person.delete, 'Delete person');

  // Math service
  //
  window.server.register('add', [['a', 'Number'], ['b', 'Number']], 'Number', add, 'Calculate the sum of two numbers');
  window.server.register('subtract', [['a', 'Number'], ['b', 'Number']], 'Number', subtract, 'Calculate the difference between two numbers');
  window.server.register('multiply', [['a', 'Number'], ['b', 'Number']], 'Number', multiply, 'Calculate the product of two numbers');
  window.server.register('divide', [['a', 'Number'], ['b', 'Number']], 'Number', divide, 'Calculate the divsion of two numbers');
  window.server.register('digits', [['num', 'Number'], ['n', 'Number']], 'Number', digits, 'Set the precicion for a number');
  window.server.register('getForms', [['version', 'Number'], ['workspaceID', 'Number']], 'Array', getForms, 'Get a list of forms for a workspace');
  window.server.register('getRecords', [['version', 'Number'], ['formID', 'Number']], 'Array', getRecords, 'Get a batch of record for a form');
  window.server.register('getWithConfig', [['config', 'Object'], ['id', 'Number']], 'Array', getWithConfig, 'Get a thing with config');

```

example.client.js:

```
  // Person service
  //
  var person = {};
  person.create = function(first, last) {
    window.client.call('person.create', { first: first, last: last });
  }
  person.update = function(first, last) {
    window.client.call('person.update', { first: first, last: last });
  }
  person.delete = function() {
    window.client.call('person.delete', {  });
  }

  // Math service
  //
  var add = function(a, b) {
    window.client.call('add', { a: a, b: b });
  }
  var subtract = function(a, b) {
    window.client.call('subtract', { a: a, b: b });
  }
  var multiply = function(a, b) {
    window.client.call('multiply', { a: a, b: b });
  }
  var divide = function(a, b) {
    window.client.call('divide', { a: a, b: b });
  }
  var digits = function(num, n) {
    window.client.call('digits', { num: num, n: n });
  }
  var getForms = function(version, workspaceID) {
    window.client.call('getForms', { version: version, workspaceID: workspaceID });
  }
  var getRecords = function(version, formID) {
    window.client.call('getRecords', { version: version, formID: formID });
  }
  var getWithConfig = function(config, id) {
    window.client.call('getWithConfig', { config: config, id: id });
  }
```

