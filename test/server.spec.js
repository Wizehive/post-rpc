var expect = chai.expect;

var origin = 'http://localhost:9877';

var serverWindow, serverDocument, server;

var clientWindow, clientDocument, client;

var jsonrpc = '2.0';

var parseErrorCode = -32700,
	parseErrorMessage = 'Parse error',
	parseErrorData = 'Invalid JSON was received by the server';

var invalidRequestCode = -32600,
	invalidRequestMessage = 'Invalid request',
	invalidRequestData = 'The JSON sent is not a valid request object';

var methodNotFoundCode = -32601,
	methodNotFoundMessage = 'Method not found',
	methodNotFoundData = 'The method does not exist / is not available';

var invalidParamsCode = -32602,
	invalidParamsMessage = 'Invalid params',
	invalidParamsData = 'Invalid method parameter(s)';

var internalErrorCode = -32603,
	internalErrorMessage = 'Internal error',
	internalServerErrorData = 'Internal JSON-RPC server error',
	internalClientErrorData = 'Internal JSON-RPC client error';

var invalidReturnCode = -32604,
	invalidReturnMessage = 'Invalid return',
	invalidReturnData = 'Invalid method return type';

var errorCode = -32000;

describe('PostRPC.Server', function () {
	// console.log('describe: PostRPC.Server: started');

	before(function () {
		// console.log('PostRPC.Server: before()');

		// logFixture();

		server = findServer();
		client = findClient();
		serverWindow = findServerWindow();
		clientWindow = findClientWindow();
	});

	describe('name', function () {
		it('should return the name', function () {
			expect(server.name).to.be.equal('PostRPC.Server');
		});
	});

	describe('origin', function () {
		it('should return the origin', function () {
			expect(server.origin).to.be.equal('http://localhost:9877');
		});
	});

	describe('register', function () {
		var f = function (a, b) { };
		it('should register the function', function () {
			expect(server.register(
				'f',
				{ a: 'Number', b: 'Number' },
				'Number',
				f,
				'F(a,b)'
			)).to.be.true;

			expect(server.registered.f).to.deep.equal({
				params: { a: 'Number', b: 'Number' },
				return: 'Number',
				function: f,
				description: 'F(a,b)'
			});
		});
	});

	describe('unregister', function () {
		var f = function (a, b) { };
		it('should unregister the function', function () {
			server.register(
				'f',
				{ a: 'Number', b: 'Number' },
				'Number',
				f,
				'F(a,b)'
			);
			expect(server.unregister('f')).to.be.true;

			expect(server.registered.hasOwnProperty('f')).to.equal(false);
		});
	});

	describe('isValid', function () {
		it('should be valid', function () {
			expect(server.isValid({ jsonrpc: '2.0', method: 'add', params: { a: 2, b: 2 } })).to.be.true;
		});

		it('should not be valid', function () {
			expect(server.isValid({ jsonrpc: '2.0', params: { a: 2, b: 2 } })).to.not.be.true;

			expect(server.isValid({ jsonrpc: '2.0', method: 'rpc.add', params: { a: 2, b: 2 } })).to.not.be.true;

			expect(server.isValid({ method: 'add', params: { a: 2, b: 2 } })).to.not.be.true;
		});
	});

	describe('isMethodFound', function () {
		var f = function (a, b) { };
		var request = { jsonrpc: '2.0', method: 'f', params: { a: 2, b: 2 } };
		it('should find method', function () {
			server.register(
				'f',
				{ a: 'Number', b: 'Number' },
				'Number',
				f,
				'F(a,b)'
			);

			expect(server.isMethodFound(request)).to.be.true;
		});

		it('should not find method', function () {
			server.unregister('f');

			expect(server.isMethodFound(request)).to.not.be.true;
		});
	});

	describe('parseErrorResponse', function () {
		it('should be correct response', function () {

			expect(server.parseErrorResponse()).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: parseErrorCode,
					message: parseErrorMessage,
					data: parseErrorData
				},
				id: null
			});

		});
	});

	describe('invalidRequestResponse', function () {
		it('should be correct response', function () {

			expect(server.invalidRequestResponse({ id: 11 })).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: invalidRequestCode,
					message: invalidRequestMessage,
					data: invalidRequestData
				},
				id: 11
			});

		});
	});

	describe('methodNotFoundResponse', function () {
		it('should be correct response', function () {

			expect(server.methodNotFoundResponse({ id: 11 })).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: methodNotFoundCode,
					message: methodNotFoundMessage,
					data: methodNotFoundData
				},
				id: 11
			});

		});
	});

	describe('invalidParamsResponse', function () {
		it('should be correct response', function () {

			expect(server.invalidParamsResponse({ id: 11 })).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: invalidParamsCode,
					message: invalidParamsMessage,
					data: invalidParamsData
				},
				id: 11
			});

		});
	});

	describe('internalErrorResponse', function () {
		it('should be correct response', function () {

			expect(server.internalErrorResponse({ id: 11 })).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: internalErrorCode,
					message: internalErrorMessage,
					data: internalServerErrorData
				},
				id: 11
			});

		});
	});

	describe('invalidReturnResponse', function () {
		it('should be correct response', function () {

			expect(server.invalidReturnResponse({ id: 11 })).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: invalidReturnCode,
					message: invalidReturnMessage,
					data: invalidReturnData
				},
				id: 11
			});

		});
	});

	describe('success', function () {
		it('should be correct response', function () {
			expect(server.success(2, 11)).to.deep.equal({
				jsonrpc: '2.0',
				result: 2,
				id: 11
			});

		});
	});

	describe('failure', function () {
		it('should be correct response', function () {
			expect(server.failure(new RangeError('toPrecision() argument must be between 1 and 21'), 11)).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: errorCode,
					message: 'RangeError',
					data: 'toPrecision() argument must be between 1 and 21'
				},
				id: 11
			});

		});
	});
	// {"jsonrpc":"2.0","error":{"code":-32000,"message":"Error","data":"toPrecision() argument must be between 1 and 21"},"id":11}

	describe('event', function () {
		it('should be correct response', function () {
			expect(server.event('changed', { state: 'done' })).to.deep.equal({
				jsonrpc: '2.0',
				result: {
					state: 'done'
				},
				event: 'changed',
				id: null
			});

		});
	});


	describe('publish', function () {

		var postSpy;

		beforeEach(function () {
			postSpy = sinon.spy(server, 'post');
			server.start();
			client.start();
		});

		it('should publish notification', function () {
			server.publish('changed', { state: 'done' });

			expect(postSpy.callCount).to.be.equal(1);
			expect(postSpy.getCall(0).args[0]).to.equal(clientWindow);
			expect(postSpy.getCall(0).args[1].event).to.equal('changed');
			expect(postSpy.getCall(0).args[1].result).to.deep.equal({ state: 'done' });
			expect(postSpy.getCall(0).args[2]).to.equal('http://localhost:9877');
		});

		afterEach(function () {
			server.post.restore();
		});

	});

	// start()
	describe('start', function () {

		var addEventListenerSpy;

		beforeEach(function () {
			addEventListenerSpy = sinon.spy(serverWindow, 'addEventListener');
		});

		xit('should add event listener on message for window', function () {
			server.start();

			expect(addEventListenerSpy.callCount).equal(1);
			expect(addEventListenerSpy.args[0][0]).equal('message');
		});

		afterEach(function () {
			serverWindow.addEventListener.restore();
		});
	});

	// stop()
	describe('stop', function () {

		var removeEventListenerSpy;

		beforeEach(function () {
			removeEventListenerSpy = sinon.spy(serverWindow, 'removeEventListener');
			server.start();
			server.stop();
		});

		xit('should remove event listener on message for window', function () {
			expect(removeEventListenerSpy.callCount).equal(1);
			expect(removeEventListenerSpy.args[0][0]).equal('message');
		});

		afterEach(function () {
			serverWindow.removeEventListener.restore();
		});
	});

	// mapParams(given, required)
	describe('mapParams', function () {

		it('should map parameter from object', function () {
			var required = [['a', 'Number'], ['b', 'String']];
			var extra = { a: 3, b: 'test', c: true };
			var matching = { a: 3, b: 'test' };
			var missing = { b: 'test' };

			expect(server.mapParams(extra, required)).to.deep.equal([3, 'test']);
			expect(server.mapParams(matching, required)).to.deep.equal([3, 'test']);
			expect(server.mapParams(missing, required)).to.deep.equal(['test']);
		});

		it('should map parameter from array', function () {
			var required = [['a', 'Number'], ['b', 'String']];
			var extra = [3, 'test', true];
			var matching = [3, 'test'];
			var missing = ['test'];

			expect(server.mapParams(extra, required)).to.deep.equal([3, 'test']);
			expect(server.mapParams(matching, required)).to.deep.equal([3, 'test']);
			expect(server.mapParams(missing, required)).to.deep.equal(['test']);
		});

	});

	// messageHandler(event)
	describe('messageHandler', function () {
		//it('pending');

		var postSpy;

		beforeEach(function () {
			postSpy = sinon.spy(server, 'post');
			server.start();
			client.start();
		});

		it('should post invalid request', function () {
			server.request({ id: 11 }, clientWindow);

			expect(postSpy.callCount).to.be.equal(1);
			expect(postSpy.getCall(0).args[0]).to.equal(clientWindow);
			expect(postSpy.getCall(0).args[1]).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: invalidRequestCode,
					message: invalidRequestMessage,
					data: invalidRequestData
				},
				id: 11
			});
			expect(postSpy.getCall(0).args[2]).to.equal('*');
		});

		it('should post method not found', function () {
			server.request({ jsonrpc: '2.0', method: 'notFound', params: {}, id: 11 }, clientWindow);

			expect(postSpy.callCount).to.be.equal(1);
			expect(postSpy.getCall(0).args[0]).to.equal(clientWindow);
			expect(postSpy.getCall(0).args[1]).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: methodNotFoundCode,
					message: methodNotFoundMessage,
					data: methodNotFoundData
				},
				id: 11
			});
			expect(postSpy.getCall(0).args[2]).to.equal('*');
		});

		it('should post invalid params', function () {
			var f = function (a, b) { };
			server.register(
				'f',
				[['a', 'Number'], ['b', 'Number']],
				'Number',
				f,
				'F(a, b)'
			);
			server.request({ jsonrpc: '2.0', method: 'f', params: { a: 1 }, id: 11 }, clientWindow);

			expect(postSpy.callCount).to.be.equal(1);
			expect(postSpy.getCall(0).args[0]).to.equal(clientWindow);
			expect(postSpy.getCall(0).args[1]).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: invalidParamsCode,
					message: invalidParamsMessage,
					data: invalidParamsData
				},
				id: 11
			});
			expect(postSpy.getCall(0).args[2]).to.equal('*');
		});

		describe("promise success", function () {
			var f = function (a, b) {
				return new Promise(function (resolve, reject) {
					resolve({ c: 101, d: 202 });
				});
			};

			beforeEach(function () {
				server.register(
					'f',
					[['a', 'Number'], ['b', 'Number']],
					'Number',
					f,
					'F(a, b)'
				);
			});

			it('should post promise success', function () {
				return client.call('f', { a: 2, b: 2 })
					.then(function (result) {
						expect(postSpy.callCount).to.be.equal(1);
						expect(postSpy.getCall(0).args[0]).to.equal(clientWindow);
						expect(postSpy.getCall(0).args[1]).to.deep.equal({
							jsonrpc: '2.0',
							result: {
								c: 101,
								d: 202
							},
							id: 1
						});
						expect(postSpy.getCall(0).args[2]).to.equal('http://localhost:9877');
					});
			});
		});

		describe("promise failure", function () {
			var f = function (a, b) {
				return new Promise(function (resolve, reject) {
					reject({ name: 'No Answer', data: 'The remote server did not answer' });
				});
			};

			beforeEach(function () {
				server.register(
					'f',
					[['a', 'Number'], ['b', 'Number']],
					'Number',
					f,
					'F(a, b)'
				);
			});

			it('should post promise failure', function () {
				return client.call('f', { a: 2, b: 2 })
					.catch(function (result) {
						expect(postSpy.callCount).to.be.equal(1);
						expect(postSpy.getCall(0).args[0]).to.equal(clientWindow);
						expect(postSpy.getCall(0).args[1]).to.deep.equal({
							jsonrpc: '2.0',
							error: {
								code: errorCode,
								message: 'No Answer',
								data: 'The remote server did not answer'
							},
							id: 1
						});
						expect(postSpy.getCall(0).args[2]).to.equal('*');
					});
			});
		});

		it('should post allowable success', function () {
			var f = function (a, b) {
				return { c: 101, d: 202 };
			};
			server.register(
				'f',
				[['a', 'Number'], ['b', 'Number']],
				'Number',
				f,
				'F(a, b)'
			);
			server.request({ jsonrpc: '2.0', method: 'f', params: { a: 1, b: 2 }, id: 11 }, clientWindow);

			expect(postSpy.callCount).to.be.equal(1);
			expect(postSpy.getCall(0).args[0]).to.equal(clientWindow);
			expect(postSpy.getCall(0).args[1]).to.deep.equal({
				jsonrpc: '2.0',
				result: {
					c: 101,
					d: 202
				},
				id: 11
			});
			expect(postSpy.getCall(0).args[2]).to.equal('*');
		});

		it('should post invalid return', function () {
			var f = function (a, b) {
				var notallowed = function () { };
				return notallowed;
			};
			server.register(
				'f',
				[['a', 'Number'], ['b', 'Number']],
				'Date',
				f,
				'F(a, b)'
			);
			server.request({ jsonrpc: '2.0', method: 'f', params: { a: 1, b: 2 }, id: 11 }, clientWindow);

			expect(postSpy.callCount).to.be.equal(1);
			expect(postSpy.getCall(0).args[1]).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: invalidReturnCode,
					message: invalidReturnMessage,
					data: invalidReturnData
				},
				id: 11
			});
			expect(postSpy.getCall(0).args[2]).to.equal('*');
		});

		it('should post try failure', function () {
			var digits = function (num, n) {
				return num.toPrecision(n);
			};
			server.register(
				'digits',
				[['num', 'Number'], ['n', 'Number']],
				'Date',
				digits,
				'digits(num, n)'
			);
			server.request({ jsonrpc: '2.0', method: 'digits', params: { num: 1, n: 500 }, id: 11 }, clientWindow);

			expect(postSpy.callCount).to.be.equal(1);
			expect(postSpy.getCall(0).args[1]).to.deep.equal({
				jsonrpc: '2.0',
				error: {
					code: errorCode,
					message: 'RangeError',
					data: 'toPrecision() argument must be between 1 and 21'
				},
				id: 11
			});
			expect(postSpy.getCall(0).args[2]).to.equal('*');
		});

		afterEach(function () {
			server.post.restore();
		});

	});

	// logging(enabled)
	describe('logging', function () {
		it('pending');
	});

	// log(messages, color = 'blue')
	describe('log', function () {
		it('pending');
	});

	// logGroup(messages, color = 'blue')
	describe('logGroup', function () {
		it('pending');
	});

	// logRegistered(color = 'blue')
	describe('logRegistered', function () {
		it('pending');
	});

});
