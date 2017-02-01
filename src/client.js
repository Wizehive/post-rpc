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

const jsonrpc = '2.0';

const timeoutCode = -32001,
	  timeoutMessage = 'Timeout',
	  timeoutData = 'The server didn\'t respond to request within timeframe allowed.';

export default class PostRPCClient {

	constructor(origin) {
		this._name = 'PostRPC.Client';
		this._origin = origin;
		this._id = 1;
		this._queue = [];
		this._subscribed = {};
		this._logging = false;
		setInterval(() => this.timeoutHandler(), 250);
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
		this.log([
			'subscribe',
			'event: ' + event,
			'callback: function() {}'
		]);
		this._subscribed[event] = {
			callback: callback
		};
	}

	/**
	 * Unsubscribe from notification
	 * @param {String} event
	 * @return {Undefined}
	*/
	unsubscribe(event) {
		delete this._subscribed[event];
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
		window.addEventListener('message', (event) => this.messageHandler(event));
	}

	/**
	 * Stop the client (remove postMessage event listener)
	 * @return {Undefined}
	*/
	stop() {
		window.removeEventListener('message', (event) => this.messageHandler(event));
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
	 * Call a registered RPC
	 * @param {String} method
	 * @param {Object|Array} params
	 * @param {Function} callback to return response
	 * @param {Number} timeout in MS to await response
	 * @return {Undefined}
	*/
	call(method, params, callback, timeout = 5000) {
		this.log([
			'call',
			'method: ' + method,
			'params: ' + JSON.stringify(params),
			'callback: function() {}',
			'timeout: ' + timeout
		]);
		this._queue.push({
			method: method,
			params: params,
			id: this.id,
			sent: Date.now(),
			timeout: timeout,
			callback: callback
		});
		parent.postMessage(this.request(method, params, this.id), this._origin);
		this.nextID();
	}

	/**
	 * Handle RPC timeouts (server does not respond
	 * within a given amount of time)
	 * @return {Undefined}
	*/
	timeoutHandler() {
		var now = Date.now();

		for (var i = this._queue.length - 1; i >= 0; i--) {
			var call = this._queue[i];

			// Expired?
			if ((now - call.sent) > call.timeout) {
				this.log([
					'call expired, id: ' + call.id,
					'timeout response',
					'called, call callback'
				]);
				call.callback(this.timeoutResponse(call.id));
				this._queue.splice(i, 1);
			}
		}
	}

	/**
	 * Handle postMessage events for child iFrame window
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

        if (event.origin === this._origin) {
			var response = event.data;
			var messages = ['response: ' + JSON.stringify(response)];

			if (response && response.id) {	// Call
				messages.push('call response');

				for (var i = this._queue.length - 1; i >= 0; i--) {
					var call = this._queue[i];

					// Match to queue
					if (response.id === call.id) {
						messages.push('called, call callback');
						call.callback(response);
						this._queue.splice(i, 1);
					}
				}

			} else if (response && response.event) {	// Event
				messages.push('event response');

				if (response.event in this._subscribed) {
					messages.push('subscribed, call callback');
					var subscribe = this._subscribed[response.event];
					subscribe.callback(response);
				}

			}
			this.log(messages);
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
	log(messages, color = 'green') {
		if (this._logging) {
			console.group(this._name);
			for (var i = 0; i < messages.length; i++) {
				console.log('%c%s', 'color:' + color, messages[i]);
			}
			console.groupEnd();
		}
	}

}
