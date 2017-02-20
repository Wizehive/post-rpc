/**
 * PostRPC Server
 *
 * Implements JSON RPC v2 protocol over window.postMessage transport
 * providing sandboxed iFrames a secure/restricted communication
 * mechanism.
 *
 * In addition to responding to registered RCP's, the server can
 * publish notifications to clients.
 *
 * Usage:
 *
 * Load PostRPC.Server library into parent window and create a server
 * instance.  Register the set of methods the server will respond to
 * and then start the server:
 *
 *		var server = new PostRPC.Server('http://localhost:5001');
 *
 *		server.register('add', {a: 'Number', b: 'Number'}, 'Number', add);
 *		server.register('multiply', {a: 'Number', b: 'Number'}, 'Number', multiply);
 *
 *		server.start();
 *
 * Notifications can be published any time afterwards as:
 *
 *		server.publish('something', {stuff: 'Of interest if anyone cares'});
 *
 */

const jsonrpc = '2.0';

const parseErrorCode = -32700,
	  parseErrorMessage = 'Parse error',
	  parseErrorData = 'Invalid JSON was received by the server';

const invalidRequestCode = -32600,
	  invalidRequestMessage = 'Invalid request',
	  invalidRequestData = 'The JSON sent is not a valid request object';

const methodNotFoundCode = -32601,
	  methodNotFoundMessage = 'Method not found',
	  methodNotFoundData = 'The method does not exist / is not available';

const invalidParamsCode = -32602,
	  invalidParamsMessage = 'Invalid params',
	  invalidParamsData = 'Invalid method parameter(s)';

const internalErrorCode = -32603,
	  internalErrorMessage = 'Internal error',
	  internalErrorData = 'Internal JSON-RPC server error';

const invalidReturnCode = -32604,
	  invalidReturnMessage = 'Invalid return',
	  invalidReturnData = 'Invalid method return type';

const errorCode = -32000;

const allowable = [
	'boolean',
	'null',
	'undefined',
	'number',
	'string',
	'symbol',
	'object',
	'array'
];

export default class PostRPCServer {

	/**
	 * Construct server instance
	 * @param {Window} hostWindow  window server runs in
	 * @param {String} origin  origin uri expected from client
	 * @return {PostRPCServer} instance
	 */
	constructor(origin) {
		this._running = null;
		this._listener = undefined;
		this.init(origin);
	}

	/**
	 * Initialize/Reinitial
	 * @param {String} origin
	 * @return {Undefined}
	 */
	init(origin) {
		this.stop();
		this._name = 'PostRPC.Server';
		this._origin = origin;
		this._registered = {};
		this._logging = false;
	}

	/**
	 * Get server class name
	 * @return {string} class name
	 */
	get name() {
		return this._name;
	}

	/**
	 * Get origin uri expected from client
	 * @return {string} class name
	 */
	get origin() {
		return this._origin;
	}

	/**
	 * Get window server is in
	 * @return {Window}
	 */
	get window() {
		return window;
	}

	/**
	 * Get list of registered RPC's
	 * @return {Array[Object]} rpcs
	 */
	get registered() {
		return this._registered;
	}

	/**
	 * Register RPC method
	 * @param {String} method
	 * @param {Object|Array[string]} param signature of method
	 * @param {Type} ret signature of return
	 * @param {Function} func function to perform call
	 * @return {Boolean}
	*/
	register(method, params, ret, func, desc) {
		this.logGroup('register', [
			'method: ' + method,
			'params: ' + JSON.stringify(params),
			'return: ' + JSON.stringify(ret),
			'function: function() {}',
			'description: ' + desc

		]);
		this._registered[method] = {
			params: params,
			return: ret,
			function: func,
			description: desc
		};
		return true;
	}

	/**
	 * Unregister RPC method
	 * @param {String} method
	 * @return {Boolean}
	*/
	unregister(method) {
		if (this._registered.hasOwnProperty(method)) {
			delete this._registered[method];
			return true;
		}
		return false;

	}

	/**
	 * Is a valid (JSON-RPC v2) request?
	 * @param {Object} request
	 * @return {Boolean}
	*/
	isValid(request) {
		if (
			!(request.jsonrpc === jsonrpc) ||
			!(request.method) ||
			!('method' in request) ||
			(request.method && request.method.lastIndexOf('rpc.', 0) === 0)
		) {
			return false;
		}
		return true;
	}

	/**
	 * Is method found (registered RPC)?
	 * @param {Object} request
	 * @return {Boolean}
	*/
	isMethodFound(request) {
		if (request.method in this._registered) {
			return true;
		}
		return false;
	}

	/**
	 * JSON-RPC v2 parse error response
	 * @return {Object} response
	*/
	parseErrorResponse() {
		return {
			jsonrpc: jsonrpc,
			error: {
				code: parseErrorCode,
				message: parseErrorMessage,
				data: parseErrorData
			},
			id: null
		};
	}

	/**
	 * JSON-RPC v2 invalid request response
	 * @return {Object} response
	*/
	invalidRequestResponse(request) {
		return {
			jsonrpc: jsonrpc,
			error: {
				code: invalidRequestCode,
				message: invalidRequestMessage,
				data: invalidRequestData
			},
			id: request.id
		};
	}

	/**
	 * JSON-RPC v2 method not found response
	 * @return {Object} response
	*/
	methodNotFoundResponse(request) {
		return {
			jsonrpc: jsonrpc,
			error: {
				code: methodNotFoundCode,
				message: methodNotFoundMessage,
				data: methodNotFoundData
			},
			id: request.id
		};
	}

	/**
	 * JSON-RPC v2 invalid params response
	 * @return {Object} response
	*/
	invalidParamsResponse(request) {
		return {
			jsonrpc: jsonrpc,
			error: {
				code: invalidParamsCode,
				message: invalidParamsMessage,
				data: invalidParamsData
			},
			id: request.id
		};
	}

	/**
	 * JSON-RPC v2 internal error response
	 * @return {Object} response
	*/
	internalErrorResponse(request) {
		return {
			jsonrpc: jsonrpc,
			error: {
				code: internalErrorCode,
				message: internalErrorMessage,
				data: internalErrorData
			},
			id: request.id
		};
	}

	/**
	 * JSON-RPC v2 invalid return response
	 * @return {Object} response
	*/
	invalidReturnResponse(request) {
		return {
			jsonrpc: jsonrpc,
			error: {
				code: invalidReturnCode,
				message: invalidReturnMessage,
				data: invalidReturnData
			},
			id: request.id
		};
	}

	/**
	 * JSON-RPC v2 success response
	 * @return {Object} response
	*/
	success(result, id) {
		return {
			jsonrpc: jsonrpc,
			result: result,
			id: id
		};
	}

	/**
	 * JSON-RPC v2 failure response
	 * @return {Object} response
	*/
	failure(error, id) {
		if (error instanceof Error) {
			return {
				jsonrpc: jsonrpc,
				error: {
					code: errorCode,
					message: error.name,
					data: error.message
				},
				id: id
			};
		} else if (typeof error === 'object') {
			var message, data;
			if (error.name || error.hasOwnProperty('name')) {
				message = error.name;
			} else if (error.hasOwnProperty('error')) {
				message = error.error;
			} else {
				message = 'Error';
			}
			if (error.message || error.hasOwnProperty('message')) {
				data = error.message;
			} else if (error.hasOwnProperty('detail')) {
				data = error.detail;
			} else if (error.hasOwnProperty('data')) {
				data = error.data;
			} else {
				data = JSON.stringify(error);
			}
			return {
				jsonrpc: jsonrpc,
				error: {
					code: errorCode,
					message: message,
					data: data
				},
				id: id
			};
		} else if (typeof error === 'string') {
			return {
				jsonrpc: jsonrpc,
				error: {
					code: errorCode,
					message: 'Error',
					data: error
				},
				id: id
			};
		}
		return {
			jsonrpc: jsonrpc,
			error: {
				code: errorCode,
				message: 'Error',
				data: JSON.stringify(error)
			},
			id: id
		};
	}

	/**
	 * JSON-RPC v2+ event notification response
	 * @return {Object} response
	*/
	event(result, name) {
		return {
			jsonrpc: jsonrpc,
			result: result,
			event: name,
			id: null
		};
	}

	/**
	 * Publish event notification to all child iFrame windows
	 * @param {String} name of event
	 * @param {Object} result
	 * @return {Undefined}
	*/
	publish(name, result) {
		if (this._running) {
			var messages = ['publish: name: ' + name + ', result: ' + JSON.stringify(result)];

			for (var i = 0; i < window.frames.length; i++) {
				var frame = window.frames[i];

				this.post(frame, this.event(result, name), '*');

			}
			messages.push('(' + window.frames.length + ') post publish');
			this.log(messages);
		} else {
			throw new Error('Server is not running');
		}
	}

	/**
	 * Start the server (add postMessage event listener)
	 * @return {Undefined}
	*/
	start() {
		if (this._listener === undefined) {
			this._listener = this.messageHandler.bind(this);
			window.addEventListener('message', this._listener);
		}
		this._running = true;
	}

	/**
	 * Stop the server (remove postMessage event listener)
	 * @return {Undefined}
	*/
	stop() {
		if (this._listener) {
			window.removeEventListener('message', this._listener);
			this._listener = undefined;
		}
		this._running = false;
	}

	/**
	 * Map given parameters according to required
	 * @param {Object|Array} given
	 * @param {Array[Array]} required
	 * @return {Array} params
	*/
	mapParams(given, required) {
		var params = [];
		for (var i = 0; i < required.length; i++) {
			var p = required[i];
			if (Array.isArray(given)) {
				if (i < given.length) {
					params.push(given[i]);
				}
			} else if (given !== null && typeof given === 'object') {
				if (p[0] in given) {
					params.push(given[p[0]]);
				}
			}
		}
		return params;
	}

	/**
	 * Wrap postMessage for testablity
	 * @param {Window} targetWindow
	 * @param {Object} message
	 * @param {String} targetOrigin
	 * @return {Undefined}
	*/
	post(targetWindow, message, targetOrigin) {
		// console.log('server post', message);
		if (this._running && targetWindow) {
			targetWindow.postMessage(message, targetOrigin);
		}
	}

	/**
	 * Wrap request for testablity
	 * @param {Object} request
	 * @param {Window} targetWindow
	 * @return {Undefined}
	*/
	request(request, targetWindow) {

		if (this._running) {
			var messages = ['request: ' + JSON.stringify(request)];

			if (!this.isValid(request)) {
				messages.push('post invalid');
				this.post(targetWindow, this.invalidRequestResponse(request), '*');
			} else if (!this.isMethodFound(request)) {
				messages.push('post method not found');
				this.post(targetWindow, this.methodNotFoundResponse(request), '*');
			} else {
				var rpc = this._registered[request.method];
				var func = rpc.function;
				var args = this.mapParams(request.params, rpc.params);
				if (args.length !== rpc.params.length) {
					messages.push('post invalid params');
					this.post(targetWindow, this.invalidParamsResponse(request), '*');
				} else {
					messages.push('call: ' + request.method + '(' + args.join(', ') + ')');
					try {
						var result = func(...args);

						if (typeof result === 'object' && typeof result.then === 'function') {
							messages.push('func result is a promise');
							var self = this;
							result
							.then(function (res) {
								self.log([
									'return: ' + JSON.stringify(res),
									'post promise success'
								]);
								self.post(targetWindow, self.success(res, request.id), '*');
							})
							.catch(function (err) {
								self.log([
									'return: ' + JSON.stringify(err),
									'post promise failure'
								]);
								self.post(targetWindow, self.failure(err, request.id), '*');
						    });
						} else if (allowable.indexOf(typeof result) >= 0) {
							messages.push('func result is allowable type');
							messages.push('return: ' + JSON.stringify(result));
							messages.push('post allowable success');
							this.post(targetWindow, this.success(result, request.id), '*');
						} else if (allowable.indexOf(typeof result) < 0) {
							messages.push('func result is NOT allowable type');
							messages.push('type: ' + typeof result);
							messages.push('post invalid return');
							this.post(targetWindow, this.invalidReturnResponse(request), '*');
						} else {
							messages.push('internal error');
							messages.push('post internal error failure');
							this.post(targetWindow, this.internalErrorResponse(request), '*');
						}
					} catch(error) {
						messages.push('error: ' + JSON.stringify(error));
						messages.push('post try failure');
						this.post(targetWindow, this.failure(error, request.id), '*');
					}
				}
			}
			this.log(messages);
		}
	}

	/**
	 * Handle postMessage events for parent window
	 * @param {Object} event
	 * @return {Undefined}
	*/
	messageHandler(event) {
		// console.log('server message', event.data);
		if (this._running) {
			if (event.origin === 'null' || event.origin === this._origin) {
				if (event.source && event.source !== window) {
					this.request(event.data, event.source);
				}
			}
		}
	}

	/**
	 * Enable/Disable console logging
	 * @param {String} event
	 * @param {Function} callback function to notify
	 * @return {Undefined}
	*/
	logging(enabled) {
		this._logging = enabled;
	}

	/**
	 * Log messages to console
	 * @param {Array[String]} messages
	 * @param {String} color
	 * @return {Undefined}
	*/
 	/* istanbul ignore next */
	log(messages, color = 'blue') {
		if (this._logging) {
			console.group(this._name);

			for (var i = 0; i < messages.length; i++) {
				console.log('%c%s', 'color:' + color, messages[i]);
			}
			console.groupEnd();
		}
	}

	/**
	 * Log group messages to console
	 * @param {Array[String]} messages
	 * @param {String} color
	 * @return {Undefined}
	*/
 	/* istanbul ignore next */
	logGroup(group, messages, color = 'blue') {
		if (this._logging) {
			console.group(this._name);
			console.groupCollapsed(group);

			for (var i = 0; i < messages.length; i++) {
				console.log('%c%s', 'color:' + color, messages[i]);
			}
			console.groupEnd();
			console.groupEnd();
		}
	}

	/**
	 * Log all registered RPC's
	 * @return {Array[Object]} rpcs
	 */
 	/* istanbul ignore next */
	logRegistered(color = 'blue') {
		if (this._logging) {
			console.group(this._name);
			console.group('registered');

			var self = this;
			var arr = Object.keys(self._registered).map(function (key) {
				return [key, self._registered[key]];
			});
			var sorted = arr.sort(function (a, b) {
				if (a[0] < b[0]) {
					return -1;
				}
				if (a[0] > b[0]) {
					return 1;
				}
				return 0;
			});
			for (var i = 0; i < sorted.length; i++) {

				var messages = [];
				var method = sorted[i][0];
				var r = sorted[i][1];
				var params = [];
				var params2 = [];

				messages.push('/**');
				messages.push(' * ' + r.description);
				var types = {
					'Boolean': 'true',
					'Null': 'null',
					'Undefined': 'undefined',
					'Number': '1',
					'String': 'str',
					'Object': '{a: 1}',
					'Array': '[1,2]'
				};

				for (var j = 0; j < r.params.length; j++) {
					var p = r.params[j];
					messages.push(' * @param {' + p[1] + '} ' + p[0]);
					params.push(p[0]);
					params2.push(p[0] + ': ' + types[p[1]]);
				}

				messages.push(' * @return {' + r.return + '}');
				messages.push(' */');
				messages.push(method + '(' + params.join(', ') + ')');
				messages.push('client.call(\'' + method + '\', {' + params2.join(', ') + '}, func)');

				console.groupCollapsed(method);
				for (var k = 0; k < messages.length; k++) {
					console.log('%c%s', 'color:' + color, messages[k]);
				}
				console.groupEnd();
			}

			console.groupEnd();
			console.groupEnd();
		}
	}

}
