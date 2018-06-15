/**
 * PostRPC Client
 *
 * Implements JSON RPC v2 protocol over window.postMessage transport
 * providing sandboxed iFrames a secure/restricted communication
 * mechanism.
 *
 * In addition to calling registered RCP's, the client can subscribe
 * to published notifications from the server.
 *
 * Usage:
 *
 * Load PostRPC.Client library into child iFrame window and create a
 * client instance and then start the client:
 *
 *
 *		var client = new window.PostRPC.Client('http://localhost:5001');
 *		client.start();
 *
 * Notifications can be subscribed to any time afterwards as:
 *
 *
 *		client.subscribe('changed', function(response) {
 *			display(null, response);
 *		});
 *
 * Registered server RPC's can be called any time afterwards as:
 *
 *			client.call('add', {a: 2, b: 2}, function(response) {
 *				display(response);
 *			});
 *
 */

var Promise = require('native-promise-only');

const jsonrpc = '2.0';

const timeoutCode = -32001,
	  timeoutMessage = 'Timeout',
	  timeoutData = 'The server didn\'t respond to request within timeframe allowed';

const internalErrorCode = -32603,
	  internalErrorMessage = 'Internal error',
	  internalErrorData = 'Internal JSON-RPC client error';

export default class PostRPCClient {

	/**
	 * Constructor
	 * @param {Window} hostWindow  window client runs in
	 * @param {String} origin  origin uri expected from client
	 * @return {PostRPCClient} instance
	 */
	constructor(origin) {
		this._running = null;
		this._timer = undefined;
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
		this._name = 'PostRPC.Client';
		this._origin = origin;
		this._id = 1;
		this._queue = [];
		this._subscribed = {};
		this._logging = false;
	}

	/**
	 * Get client class name
	 * @return {string} class name
	 */
	get name() {
		return this._name;
	}

	/**
	 * Get origin uri expected from server
	 * @return {string} class name
	 */
	get origin() {
		return this._origin;
	}

	/**
	 * Get window client is in
	 * @return {Window}
	 */
	get window() {
		return window;
	}

	/**
	 * Get parent window of client window (where server must be)
	 * @return {Window}
	 */
	get parent() {
		return window.opener || window.parent;
	}

	/**
	 * Get current id
	 * @return {Number} id
	 */
	get id() {
		return this._id;
	}

	/**
	 * Get list of subscribed notifications's
	 * @return {Array[Object]} notifications
	 */
	get subscribed() {
		return this._subscribed;
	}

	/**
	 * Subscribe to notification
	 * @param {String} event
	 * @param {Function} callback function to notify
	 * @return {Undefined}
	*/
	subscribe(event, callback) {
		if (TARGET === 'dev') {
			this.logGroup('subscribe', [
				'event: ' + event,
				'callback: function() {}'
			]);
		}
		this._subscribed[event] = {
			callback: callback
		};
		return true;
	}

	/**
	 * Unsubscribe from notification
	 * @param {String} event
	 * @return {Undefined}
	*/
	unsubscribe(event) {
		delete this._subscribed[event];
		return true;
	}

	/**
	 * Increment to the next id
	 * @return {Number} id
	 */
	nextID() {
		return this._id++;
	}

	/**
	 * Start the client (add postMessage event listener)
	 * @return {Undefined}
	*/
	start() {
		if (this._timer === undefined) {
			this._timer = window.setInterval(() => this.timeoutHandler(), 250);
		}
		if (this._listener === undefined) {
			this._listener = this.messageHandler.bind(this);
			window.addEventListener('message', this._listener);
		}
		this._running = true;
	}

	/**
	 * Stop the client (remove postMessage event listener)
	 * @return {Undefined}
	*/
	stop() {
		if (this._timer) {
			window.clearInterval(this._timer);
			this._timer = undefined;
		}
		if (this._listener) {
			window.removeEventListener('message', this._listener);
			this._listener = undefined;
		}
		this._running = false;
	}

	/**
	 * JSON-RPC v2 request
	 * @return {Object} response
	*/
	request(method, params, id) {
		return {
			jsonrpc: jsonrpc,
			method: method,
			params: params,
			id: id
		};
	}

	/**
	 * JSON-RPC v2+ timeout response
	 * @return {Object} response
	*/
	timeoutResponse(id) {
		return {
			jsonrpc: jsonrpc,
			error: {
				code: timeoutCode,
				message: timeoutMessage,
				data: timeoutData
			},
			id: id
		};
	}

	/**
	 * JSON-RPC v2+ internal error response
	 * @return {Object} response
	*/
	internalErrorResponse(id) {
		return {
			jsonrpc: jsonrpc,
			error: {
				code: internalErrorCode,
				message: internalErrorMessage,
				data: internalErrorData
			},
			id: id
		};
	}

	/**
	 * Call a registered RPC
	 * @param {String} method
	 * @param {Object|Array} params
	 * @param {Function} callback to return response
	 * @param {Number} timeout in MS to await response
	 * @return {Undefined}
	*/
	call(method, params, callback = null, timeout = 5000) {
		if (!this._running) {
			throw new Error('Client is not running');
		}
		if (TARGET === 'dev') {
			this.log([
				'call',
				'method: ' + method,
				'params: ' + JSON.stringify(params),
				'timeout: ' + timeout,
				'callback: function() {}'
			]);
		}

		var promise = null;
		var resolve = null;
		var reject = null;

		if (callback === null) {
			promise = new Promise(function (res, rej) {
				resolve = res;
				reject = rej;
			});
		}

		this._queue.push({
			method: method,
			params: params,
			id: this.id,
			sent: Date.now(),
			timeout: timeout,
			callback: callback,
			resolve: resolve,
			reject: reject
		});
		this.post(this.parent, this.request(method, params, this.id), this._origin);
		this.nextID();
		return promise;
	}

	/**
	 * Handle RPC timeouts (server does not respond
	 * within a given amount of time)
	 * @return {Undefined}
	*/
	timeoutHandler() {
		if (this._running) {
			var now = Date.now();

			for (var i = this._queue.length - 1; i >= 0; i--) {
				var call = this._queue[i];

				// Expired?
				if ((now - call.sent) > call.timeout) {
					var messages = [];
					if (TARGET === 'dev') {
						messages = ['call expired, id: ' + call.id];
					}
					if (call.callback !== null) {
						if (TARGET === 'dev') {
							messages.push('timeout, call callback');
						}
						call.callback(this.timeoutResponse(call.id)['error']);
					} else if (call.resolve !== null || call.reject !== null) {
						if (TARGET === 'dev') {
							messages.push('timeout, reject promise');
						}
						call.reject(this.timeoutResponse(call.id)['error']);
					}
					this._queue.splice(i, 1);
					if (TARGET === 'dev') {
						this.log(messages);
					}
				}
			}
		}
	}

	/**
	 * Wrap postMessage for testablity
	 * @param {Window} targetWindow
	 * @param {Object} message
	 * @param {String} targetOrigin
	 * @return {Undefined}
	*/
	post(targetWindow, message, targetOrigin) {
		if (this._running && targetWindow) {
			targetWindow.postMessage(message, targetOrigin);
		}
	}

	/**
	 * Wrap response for testablity
	 * @param {Object} response
	 * @return {Undefined}
	*/
	response(response) {
		if (this._running) {
			var messages = [];
			var result;
			var error;

			if (TARGET === 'dev') {
				messages = ['response: ' + JSON.stringify(response)];
			}

			if (response && response.id) {	// Call
				if (TARGET === 'dev') {
					messages.push('call response');
				}

				for (var i = this._queue.length - 1; i >= 0; i--) {
					var call = this._queue[i];

					// Match to queue
					if (response.id === call.id) {
						result = response.hasOwnProperty('result') ? response.result : null;
						error = response.hasOwnProperty('error') ? response.error : null;
						if (call.callback !== null) {
							if (TARGET === 'dev') {
								messages.push('called, call callback');
							}
							call.callback(result, error);
							this._queue.splice(i, 1);
						} else if (call.resolve !== null || call.reject !== null) {
							if (TARGET === 'dev') {
								messages.push('called, resolve/reject promise');
							}
							if (error) {
								call.reject(error);
							} else if (result) {
								call.resolve(result);
							} else {
								call.reject(this.internalErrorResponse()['error']);
							}
							this._queue.splice(i, 1);
						}
					}
				}
			} else if (response && response.event) {	// Event
				if (TARGET === 'dev') {
					messages.push('event response');
				}

				if (response.event in this._subscribed) {
					if (TARGET === 'dev') {
						messages.push('subscribed, call callback');
					}
					var subscribe = this._subscribed[response.event];
					result = response.hasOwnProperty('result') ? response.result : null;
					error = response.hasOwnProperty('error') ? response.error : null;
					subscribe.callback(result, error);
				}
			}
			if (TARGET === 'dev') {
				this.log(messages);
			}
		}
	}

	/**
	 * Handle postMessage events for child iFrame window
	 * @param {Object} event
	 * @return {Undefined}
	*/
	messageHandler(event) {
		if (this._running) {
	        if (event.origin === this._origin) {
				if (event.source && event.source !== window) {
	 				this.response(event.data);
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
 	/* istanbul ignore next */
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
	log(messages, collapse = false, color = 'green') {
		if (TARGET === 'dev') {
			if (this._logging) {
				if (collapse) {
					console.groupCollapsed(this._name);
				} else {
					console.group(this._name);
				}

				for (var i = 0; i < messages.length; i++) {
					console.log('%c%s', 'color:' + color, messages[i]);
				}
				console.groupEnd();
			}
		}
	}

	/**
	 * Log group messages to console
	 * @param {Array[String]} messages
	 * @param {String} color
	 * @return {Undefined}
	*/
 	/* istanbul ignore next */
	logGroup(group, messages, color = 'green') {
		if (TARGET === 'dev') {
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
	}

}
