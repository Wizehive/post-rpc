var expect = chai.expect;

var origin = 'http://localhost:5001';
var server = new PostRPC.Server(origin);

describe('PostRPC.Server', function() {

	before(function() {
		// Create a stub child iframe to recieve postMessage
		var iframe = window.document.createElement('iframe');
        iframe.setAttribute('src', 'about:blank');
		iframe.setAttribute('id', 'client');
		iframe.setAttribute('style', 'position: fixed; top: 0; left: -99999px;');
        window.document.body.appendChild(iframe);
    });

	beforeEach(function() {
		server.init(origin);
	});

	describe('name', function() {
		it('should return the name', function() {
			expect(server.name).to.be.equal('PostRPC.Server');
		});
	});

	describe('origin', function() {
		it('should return the origin', function() {
			expect(server.origin).to.be.equal('http://localhost:5001');
		});
	});

	describe('register', function() {
		var f = function(a,b) {};
		it('should register the function', function() {
			expect(server.register(
				'f',
				{a: 'Number', b: 'Number'},
				'Number',
				f,
				'F(a,b)'
			)).to.be.true;

			expect(server.registered.f).to.deep.equal({
				params: {a: 'Number', b: 'Number'},
				return: 'Number',
				function: f,
				description: 'F(a,b)'
			});
		});
	});

	describe('unregister', function() {
		var f = function(a,b) {};
		it('should unregister the function', function() {
			server.register(
				'f',
				{a: 'Number', b: 'Number'},
				'Number',
				f,
				'F(a,b)'
			);
			expect(server.unregister('f')).to.be.true;

			expect(server.registered.hasOwnProperty('f')).to.equal(false);
		});
	});

	describe('isValid', function() {
    	it('should be valid', function() {
			expect(server.isValid({jsonrpc: '2.0', method: 'add', params: {a: 2, b: 2}})).to.be.true;
    	});

    	it('should not be valid', function() {
			expect(server.isValid({jsonrpc: '2.0', params: {a: 2, b: 2}})).to.not.be.true;

			expect(server.isValid({jsonrpc: '2.0', method: 'rpc.add', params: {a: 2, b: 2}})).to.not.be.true;

			expect(server.isValid({method: 'add', params: {a: 2, b: 2}})).to.not.be.true;
    	});
	});


	describe('isMethodFound', function() {
		var f = function(a,b) {};
		var request = {jsonrpc: '2.0', method: 'f', params: {a: 2, b: 2}};
		it('should find method', function() {
			server.register(
				'f',
				{a: 'Number', b: 'Number'},
				'Number',
				f,
				'F(a,b)'
			);

			expect(server.isMethodFound(request)).to.be.true;
		});

		it('should not find method', function() {
			server.init();

			expect(server.isMethodFound(request)).to.not.be.true;
		});
	});

	describe('parseErrorResponse', function() {
		it('should be correct response', function() {

			expect(server.parseErrorResponse()).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: -32700,
					message: 'Parse error',
					data: 'Invalid JSON was received by the server'
				},
				id: null
			});

		});
	});

	describe('invalidRequestResponse', function() {
		it('should be correct response', function() {

			expect(server.invalidRequestResponse({id: 11})).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: -32600,
					message: 'Invalid request',
					data: 'The JSON sent is not a valid request object'
				},
				id: 11
			});

		});
	});

	describe('methodNotFoundResponse', function() {
		it('should be correct response', function() {

			expect(server.methodNotFoundResponse({id: 11})).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: -32601,
					message: 'Method not found',
					data: 'The method does not exist / is not available'
				},
				id: 11
			});

		});
	});

	describe('invalidParamsResponse', function() {
		it('should be correct response', function() {

			expect(server.invalidParamsResponse({id: 11})).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: -32602,
					message: 'Invalid params',
					data: 'Invalid method parameter(s)'
				},
				id: 11
			});

		});
	});

	describe('internalErrorResponse', function() {
		it('should be correct response', function() {

			expect(server.internalErrorResponse({id: 11})).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: -32603,
					message: 'Internal error',
					data: 'Internal JSON-RPC error'
				},
				id: 11
			});

		});
	});

	describe('success', function() {
		it('should be correct response', function() {
			expect(server.success(2, 11)).to.deep.equal({
				jsonrpc: '2.0',
				result: 2,
				id: 11
			});

		});
	});

	describe('failure', function() {
		it('should be correct response', function() {
			expect(server.failure({name: 'Failed', message: 'Something went wrong'}, 11)).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: -32000,
					message: 'Failed',
					data: 'Something went wrong'
				},
				id: 11
			});

		});
	});

	describe('event', function() {
		it('should be correct response', function() {
			expect(server.event({state: 'done'}, 'changed')).to.deep.equal({
				jsonrpc: '2.0',
				result: {
					state: 'done'
				},
				event: 'changed',
				id: null
			});

		});
	});


	describe('publish', function(){

		beforeEach(function() {
	        sinon.stub(server, "post");
		});

		it('should fire a message event with correct data', function(){
			server.publish('changed', {state: 'done'});

        	expect(server.post.callCount).to.be.equal(1);
        	expect(server.post.getCall(0).args[1].event).to.equal('changed');
        	expect(server.post.getCall(0).args[1].result).to.deep.equal({state: 'done'});
		});

		afterEach(function() {
	       server.post.restore();
		});
	});

	// start()
	describe('start', function() {
    	it('pending');
	});

	// stop()
	describe('stop', function() {
    	it('pending');
	});

	// mapParams(given, required)
	describe('mapParams', function() {
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

	// log(messages, color = 'blue')
	describe('log', function() {
    	it('pending');
	});

	// logRegistered(color = 'blue')
	describe('logRegistered', function() {
    	it('pending');
	});

});
