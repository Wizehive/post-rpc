var expect = chai.expect;

var origin = 'http://localhost:6001';

var serverWindow, serverDocument, server;

var clientWindow, clientDocument, client;

var jsonrpc = '2.0';

var timeoutCode = -32001,
	  timeoutMessage = 'Timeout',
	  timeoutData = 'The server didn\'t respond to request within timeframe allowed';

var internalErrorCode = -32603,
	  internalErrorMessage = 'Internal error',
	  internalErrorData = 'Internal JSON-RPC client error';

var errorCode = -32000;

describe('PostRPC.Client', function() {
	// console.log('describe: PostRPC.Client: started');

	before(function() {
		// console.log('PostRPC.Client: before()');

		// logFixture();

		server = findServer();
		client = findClient();
		serverWindow = findServerWindow();
		clientWindow = findClientWindow();

	  	if (server.window === client.window) {
	  		throw new Error('server.window and client.window can\'t be same window');
	  	}

	});

	after(function() {
	});

	beforeEach(function() {
		server.init(origin);
		client.init(origin);
	});

	afterEach(function() {
	});

	describe('name', function() {
		it('should return the name', function() {
			expect(client.name).to.be.equal('PostRPC.Client');
		});
	});

	describe('origin', function() {
		it('should return the origin', function() {
			expect(client.origin).to.be.equal('http://localhost:6001');
		});
	});

	// get id()
	describe('id', function() {
		it('should return the id', function() {
			expect(client.id).to.be.equal(1);
		});
	});

	// subscribe(event, callback)
	describe('subscribe', function() {
		var cb = function(result,error) {};
		it('should subscribe to the event', function() {
			expect(client.subscribe(
				'changed',
				cb
			)).to.be.true;

			expect(client.subscribed.changed).to.deep.equal({
				callback: cb
			});
		});
	});

	// unsubscribe(event)
	describe('unsubscribe', function() {
		var cb = function(result,error) {};
		it('should unsubscribe from the event', function() {
			client.subscribe(
				'changed',
				cb
			);
			expect(client.unsubscribe('changed')).to.be.true;

			expect(client.subscribed.hasOwnProperty('changed')).to.equal(false);
		});
	});

	// nextID()
	describe('nextID', function() {
		it('should return the ids in sequence', function() {
			expect(client.nextID()).to.be.equal(1);
			expect(client.nextID()).to.be.equal(2);
			expect(client.nextID()).to.be.equal(3);
		});
	});

	// start()
	describe('start', function() {

		var addEventListenerSpy;

		beforeEach(function() {
			addEventListenerSpy = sinon.spy(clientWindow, 'addEventListener');
		});

		it('should add event listener on message for window', function() {
			client.start();

			expect(addEventListenerSpy.callCount).equal(1);
			expect(addEventListenerSpy.args[0][0]).equal('message');
		});

		afterEach(function() {
			clientWindow.addEventListener.restore();
		});
	});

	// stop()
	describe('stop', function() {

		var removeEventListenerSpy;

		beforeEach(function() {
			removeEventListenerSpy = sinon.spy(clientWindow, 'removeEventListener');
			client.start();
			client.stop();
		});

		it('should remove event listener on message for window', function() {
			expect(removeEventListenerSpy.callCount).equal(1);
			expect(removeEventListenerSpy.args[0][0]).equal('message');
		});

		afterEach(function() {
			clientWindow.removeEventListener.restore();
		});
	});

	// request(method, params, id)
	describe('request', function() {
		it('should be form correct request', function() {
			expect(client.request('add', {a: 2, b: -18}, 1)).to.deep.equal({
				jsonrpc: '2.0',
				method: 'add',
				params: {
					a: 2,
					b: -18
				},
				id: 1
			});

		});

	});

	describe('timeoutResponse', function() {
		it('should be correct response', function() {

			expect(client.timeoutResponse(11)).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: timeoutCode,
					message: timeoutMessage,
					data: timeoutData
				},
				id: 11
			});

		});
	});

	describe('internalErrorResponse', function() {
		it('should be correct response', function() {

			expect(client.internalErrorResponse(11)).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: internalErrorCode,
					message: internalErrorMessage,
					data: internalErrorData
				},
				id: 11
			});

		});
	});

	// call(method, params, callback = null, timeout = 5000)
	describe('call', function() {

		beforeEach(function() {
			server.start();
			client.start();
		});

		it('should return result with callback', function(done) {
			var f = function(a, b) {
				return {c: 101, d: 202};
			};
			var cb = function(result, error) {
				expect(result).to.deep.equal({
					c: 101,
					d: 202
				});
				expect(error).to.equal(null);
				done();
			};
			server.register(
				'f',
				[['a', 'Number'], ['b', 'Number']],
				'Number',
				f,
				'F(a, b)'
			);
			expect(client.call('f', {a: 2, b: -18}, cb)).to.equal(null);
		});

		it('should return error with callback', function(done) {
			var f = function(a, b) {
				throw new Error('Something went wrong');
			};
			var cb = function(result, error) {
				expect(result).to.equal(null);
				expect(error).to.deep.equal({
					code: errorCode,
					message: 'Error',
					data: 'Something went wrong'
				});
				done();
			};
			server.register(
				'f',
				[['a', 'Number'], ['b', 'Number']],
				'Number',
				f,
				'F(a, b)'
			);
			expect(client.call('f', {a: 2, b: -18}, cb)).to.equal(null);
		});

		it('should return result with promise', function() {
			var f = function(a, b) {
				return {c: 101, d: 202};
			};
			server.register(
				'f',
				[['a', 'Number'], ['b', 'Number']],
				'Number',
				f,
				'F(a, b)'
			);
			return client.call('f', {a: 2, b: -18})
			.then(function(result) {
				expect(result).to.deep.equal({
					c: 101,
					d: 202
				});
		    });
		});

		it('should return error with promise', function() {
			var f = function(a, b) {
				throw new Error('Something went wrong');
			};
			server.register(
				'f',
				[['a', 'Number'], ['b', 'Number']],
				'Number',
				f,
				'F(a, b)'
			);
			return client.call('f', {a: 2, b: -18})
			.catch(function(error) {
				expect(error).to.deep.equal({
					code: errorCode,
					message: 'Error',
					data: 'Something went wrong'
				});
		    });
		});

	});

	// timeoutHandler()
	describe('timeoutHandler', function() {
    	it('pending');
	});

	// messageHandler(event)
	describe('messageHandler', function() {
    	it('pending');
	});

	// logging(enabled)
	describe('logging', function() {
    	it('pending');
	});

	// log(messages, color = 'green')
	describe('log', function() {
    	it('pending');
	});

	// logGroup(messages, color = 'blue')
	describe('logGroup', function() {
    	it('pending');
	});

});
