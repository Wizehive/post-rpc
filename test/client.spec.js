var expect = chai.expect;

var origin = 'http://localhost:6001';

var serverWindow, serverDocument, server;

var clientWindow, clientDocument, client;

describe('PostRPC.Client', function() {

	before(function() {

		setupServer(origin);
		serverWindow = window;
		serverDocument = window.document;
		server = serverWindow.server;

		var iframe = setupClient(origin);
		clientWindow = iframe.contentWindow;
		clientDocument = clientWindow.document;
	  	client = clientWindow.client;

	});

	beforeEach(function() {
		client.init(origin);
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
    	it('pending');
	});

	// get subscribed()
	describe('subscribed', function() {
    	it('pending');
	});

	// subscribe(event, callback)
	describe('subscribe', function() {
    	it('pending');
	});

	// unsubscribe(event)
	describe('unsubscribe', function() {
    	it('pending');
	});

	// nextID()
	describe('nextID', function() {
    	it('pending');
	});

	// start()
	describe('start', function() {

		var addEventListenerSpy;

	  	beforeEach(function() {
    		addEventListenerSpy = sinon.spy(window, 'addEventListener');
	  	});

		it('should add event listener on message for window', function() {
			server.start();

		    expect(addEventListenerSpy.callCount).equal(1);
		    expect(addEventListenerSpy.args[0][0]).equal('message');
		});

		afterEach(function() {
    		window.addEventListener.restore();
		});
	});

	// stop()
	describe('stop', function() {

		var removeEventListenerSpy;

	  	beforeEach(function() {
    		removeEventListenerSpy = sinon.spy(window, 'removeEventListener');
	  	});

		it('should remove event listener on message for window', function() {
			server.start();
			server.stop();

		    expect(removeEventListenerSpy.callCount).equal(1);
		    expect(removeEventListenerSpy.args[0][0]).equal('message');
		});

		afterEach(function() {
    		window.removeEventListener.restore();
		});
	});

	// request(method, params, id)
	describe('request', function() {
    	it('pending');
	});

	// timeoutResponse(id)
	describe('timeoutResponse', function() {
    	it('pending');
	});

	// internalErrorResponse(id)
	describe('internalErrorResponse', function() {
    	it('pending');
	});

	// call(method, params, callback = null, timeout = 5000)
	describe('call', function() {
    	it('pending');
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
