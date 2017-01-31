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
 *		var server = new window.PostRPC.Server('http://localhost:5001');
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
	  parseErrorData = 'Invalid JSON was received by the server.';

const invalidRequestCode = -32600,
	  invalidRequestMessage = 'Invalid request',
	  invalidRequestData = 'The JSON sent is not a valid request object.';

const methodNotFoundCode = -32601,
	  methodNotFoundMessage = 'Method not found',
	  methodNotFoundData = 'The method does not exist / is not available.';

const invalidParamsCode = -32602,
	  invalidParamsMessage = 'Invalid params',
	  invalidParamsData = 'Invalid method parameter(s).';

const internalErrorCode = -32603,
	  internalErrorMessage = 'Internal error',
	  internalErrorData = 'Internal JSON-RPC error.';

export default class PostRPCServer {

	/**
	 * Construct server instance
	 * @param {String} origin  origin uri expected from client
	 * @return {PostRPCServer} instance
	 */
	constructor(origin) {
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
	 * @return {Undefined}
	*/
	register(method, params, ret, func) {
		this.log([
			'register',
			'method: ' + method,
			'params: ' + JSON.stringify(params),
			'ret: ' + JSON.stringify(ret),
			'function: function() {}'
		]);
		this._registered[method] = {
			params: params,
			return: ret,
			function: func
		};
	}

	/**
	 * Unregister RPC method
	 * @param {String} method
	 * @return {Undefined}
	*/
	unregister(method) {
		delete this._registered[method];
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
		return {
			jsonrpc: jsonrpc,
			error: error,
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
		var messages = ['publish: name: ' + name + ', result: ' + JSON.stringify(result)];

		for (var i = 0; i < window.frames.length; i++) {
			var frame = window.frames[i];

			frame.postMessage(this.event(result, name), '*');
		}
		messages.push('(' + window.frames.length + ') post publish');
		this.log(messages);
	}

	/**
	 * Start the server (add postMessage event listener)
	 * @return {Undefined}
	*/
	start() {
		window.addEventListener('message', (event) => this.messageHandler(event));
	}

	/**
	 * Stop the server (remove postMessage event listener)
	 * @return {Undefined}
	*/
	stop() {
		window.removeEventListener('message', (event) => this.messageHandler(event));
	}

	/**
	 * Handle postMessage events for parent window
	 * @param {Object} event
	 * @return {Undefined}
	*/
	messageHandler(event) {
		// this.log([
		// 	'event origin' + event.origin,
		// 	'event data' + event.data,
		// 	'event source' + event.source,
		// 	'this origin' + this._origin
		// ]);

		// if (!event.origin || event.origin === this._origin) {
			var request = event.data;
			var messages = ['request: ' + JSON.stringify(request)];

			if (!this.isValid(request)) {

				messages.push('post invalid');
				event.source.postMessage(this.invalidRequestResponse(request), '*');

			} else if (!this.isMethodFound(request)) {

				messages.push('post method not found');
				event.source.postMessage(this.methodNotFoundResponse(request), '*');

			} else {

				var func = this._registered[request.method].function;
				var result = null;
				if (Array.isArray(request.params)) {
					result = func(...request.params);
				} else if (request.params !== null && typeof request.params === 'object') {
					result = func(...(Object.values(request.params)));
				}
				messages.push('post success');
				event.source.postMessage(this.success(result, request.id), '*');

			}
		// }
		this.log(messages);

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
	log(messages, color = 'blue') {
		if (this._logging) {
			console.group(this._name);
			for (var i = 0; i < messages.length; i++) {
				console.log('%c%s', 'color:' + color, messages[i]);
			}
			console.groupEnd();
		}
	}

}
