var expect = chai.expect;
var client = new PostRPC.Client('http://localhost:5001');

describe('PostRPC.Client', function() {

	describe('name', function() {
		it('should return the name', function() {
			expect(client.name).to.be.equal('PostRPC.Client');
		});
	});

	describe('origin', function() {
		it('should return the origin', function() {
			expect(client.origin).to.be.equal('http://localhost:5001');
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
    	it('pending');
	});

	// stop()
	describe('stop', function() {
    	it('pending');
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

});
