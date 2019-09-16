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
 *		const client = new window.PostRPC.Client('http://localhost:5001')
 *		client.start()
 *
 * Notifications can be subscribed to any time afterwards as:
 *
 *
 *		client.subscribe('changed', function(response) {
 *			display(null, response)
 *		})
 *
 * Registered server RPC's can be called any time afterwards as:
 *
 *			client.call('add', {a: 2, b: 2}, function(response) {
 *				display(response)
 *			})
 *
 */
require('native-promise-only')

const jsonrpc = '2.0'

const timeoutCode = -32001
const timeoutMessage = 'Timeout'
const timeoutData = 'The server didn\'t respond to request within timeframe allowed'

const internalErrorCode = -32603
const internalErrorMessage = 'Internal error'
const internalErrorData = 'Internal JSON-RPC client error'

export default class PostRPCClient {
	/**
	 * Constructor
	 * @param {String} origin  origin uri expected from client
	 * @return {PostRPCClient} instance
	 */
	constructor (origin) {
		this.running = null
		this.timer = undefined
		this.listener = undefined
		this.name = 'PostRPC.Client'
		this.origin = origin
		this.id = 1
		this.queue = []
		this.subscribed = {}
		this._logging = false
	}

	/**
	 * Get parent window of client window (where server must be)
	 * @return {Window}
	 */
	parent () {
		return window.opener || window.parent
	}

	/**
	 * Subscribe to notification
	 * @param {String} event
	 * @param {Function} callback function to notify
	 * @return {Undefined}
	*/
	subscribe (event, callback) {
		if (this._logging) {
			this.logGroup('subscribe', [
				'event: ' + event,
				'callback: function() {}'
			])
		}

		this.subscribed[event] = {
			callback: callback
		}

		return true
	}

	/**
	 * Unsubscribe from notification
	 * @param {String} event
	 * @return {Undefined}
	*/
	unsubscribe (event) {
		delete this.subscribed[event]
		return true
	}

	/**
	 * Increment to the next id
	 * @return {Number} id
	 */
	nextID () {
		return this.id++
	}

	/**
	 * Start the client (add postMessage event listener)
	 * @return {Undefined}
	*/
	start () {
		if (this.timer === undefined) {
			this.timer = window.setInterval(() => this.timeoutHandler(), 250)
		}

		if (this.listener === undefined) {
			this.listener = this.messageHandler.bind(this)
			window.addEventListener('message', this.listener)
		}

		this.running = true
	}

	/**
	 * Stop the client (remove postMessage event listener)
	 * @return {Undefined}
	*/
	stop () {
		if (this.timer) {
			window.clearInterval(this.timer)
			this.timer = undefined
		}

		if (this.listener) {
			window.removeEventListener('message', this.listener)
			this.listener = undefined
		}

		this.running = false
	}

	/**
	 * JSON-RPC v2 request
	 * @return {Object} response
	*/
	request (method, args, id) {
		return {
			jsonrpc,
			method,
			args,
			id
		}
	}

	/**
	 * JSON-RPC v2+ timeout response
	 * @return {Object} response
	*/
	timeoutResponse (id) {
		return {
			jsonrpc,
			id,
			error: {
				code: timeoutCode,
				message: timeoutMessage,
				data: timeoutData
			}
		}
	}

	/**
	 * JSON-RPC v2+ internal error response
	 * @return {Object} response
	*/
	internalErrorResponse (id) {
		return {
			jsonrpc,
			id,
			error: {
				code: internalErrorCode,
				message: internalErrorMessage,
				data: internalErrorData
			}
		}
	}

	/**
	 * Call a registered RPC
	 * @param {{
	 * 	method: String
	 * 	args?: Object|Array
	 * 	callback?: Function
	 * 	timeout?: Number
	 * }} details
	 * @returns {Undefined}
	*/
	call (details) {
		if (!details || !details.method) {
			throw new Error(`Call must be made with an object containing at least a method and any necessary args
			ex: client.call({ method: 'getStuff', args: { one: 'thing' } })
			ex: client.call({
				method: 'getStuff',
				args: { one: 'thing' },
				timeout: 10000,
				callback: stuff => console.log(stuff)
			})`)
		}

		const { method, args, callback = null, timeout = 5000 } = details

		if (!this.running) {
			throw new Error('Client is not running')
		}

		if (this._logging) {
			this.log([
				'call',
				'method: ' + method,
				'args: ' + JSON.stringify(args),
				'timeout: ' + timeout,
				'callback: ' + callback
			])
		}

		let promise = null
		let res = null
		let rej = null

		if (!callback) {
			promise = new Promise((resolve, reject) => {
				res = resolve
				rej = reject
			})
		}

		this.queue.push({
			method,
			args,
			timeout,
			callback,
			id: this.id,
			sent: Date.now(),
			resolve: res,
			reject: rej
		})

		this.post(this.parent(), this.request(method, args, this.id), this.origin)
		this.nextID()

		return promise
	}

	/**
	 * Handle RPC timeouts (server does not respond
	 * within a given amount of time)
	 * @return {Undefined}
	*/
	timeoutHandler () {
		if (this.running) {
			const now = Date.now()

			for (let i = this.queue.length - 1; i >= 0; i--) {
				const call = this.queue[i]

				// Expired?
				if ((now - call.sent) > call.timeout) {
					const messages = []

					if (this._logging) {
						messages.push('call expired, id: ' + call.id)
					}

					if (typeof call.callback === 'function') {
						if (this._logging) {
							messages.push('timeout, call callback')
						}

						call.callback(this.timeoutResponse(call.id)['error'])
					} else if (call.resolve !== null || call.reject !== null) {
						if (this._logging) {
							messages.push('timeout, reject promise')
						}

						call.reject(this.timeoutResponse(call.id)['error'])
					} else {
						this.queue.splice(i, 1)

						throw new Error(`Unable to find or assign a handler for this call: ${JSON.stringify(call)}`)
					}

					this.queue.splice(i, 1)

					if (this._logging) {
						this.log(messages)
					}
				}
			}
		}
	}

	/**
	 * Send data to parent over postMessage
	 * @param {Window} targetWindow
	 * @param {Object} message
	 * @param {String} targetOrigin
	 * @return {Undefined}
	*/
	post (targetWindow, message, targetOrigin) {
		if (this.running && targetWindow) {
			targetWindow.postMessage(message, targetOrigin)
		}
	}

	/**
	 * Process reponses
	 * @param {Object} response
	 * @return {Undefined}
	*/
	response (response) {
		if (this.running) {
			const messages = []

			if (this._logging) {
				messages.push('response: ' + JSON.stringify(response))
			}

			// Payload is in response to a call
			if (response && response.id) {
				if (this._logging) {
					messages.push('call response')
				}

				for (let i = this.queue.length - 1; i >= 0; i--) {
					const call = this.queue[i]

					// Found matching call in the queue, begin processing
					if (response.id === call.id) {
						const result = response.hasOwnProperty('result') ? response.result : null
						const error = response.hasOwnProperty('error') ? response.error : null

						if (typeof call.callback === 'function') {
							if (this._logging) {
								messages.push('called, call callback')
							}

							call.callback(error, result)
							this.queue.splice(i, 1)
						} else if (typeof call.resolve === 'function' && typeof call.reject === 'function') {
							if (this._logging) {
								messages.push('called, promise')
							}

							if (error) {
								call.reject(error)

								if (this._logging) {
									messages.push('promise rejected')
								}
							} else {
								call.resolve(result)

								if (this._logging) {
									messages.push('promise resolved')
								}
							}

							this.queue.splice(i, 1)
						} else {
							this.queue.splice(i, 1)

							throw new Error(`Unable to find or assign a handler for this call: ${JSON.stringify(call)}`)
						}
					}
				}
			// Payload is from an event
			} else if (response && response.event) {
				if (this._logging) {
					messages.push('event response')
				}

				if (response.event in this.subscribed) {
					if (this._logging) {
						messages.push('subscribed, call callback')
					}

					const subscription = this.subscribed[response.event]
					const result = response.hasOwnProperty('result') ? response.result : null

					if (result && subscription && typeof subscription.callback === 'function') {
						subscription.callback(result)
					}
				}
			}

			if (this._logging) {
				this.log(messages)
			}
		}
	}

	/**
	 * Handle postMessage events for child iFrame window
	 * @param {Object} event
	 * @return {Undefined}
	*/
	messageHandler (event) {
		if (this.running && event.origin === this.origin && event.source && event.source !== window) {
			this.response(event.data)
		}
	}

	/**
	 * Enable/Disable console logging
	 * @param {String} event
	 * @param {Function} callback function to notify
	 * @return {Undefined}
	*/
	/* istanbul ignore next */
	logging (enabled) {
		this._logging = enabled
	}

	/**
	 * Log messages to console
	 * @param {Array[String]} messages
	 * @param {String} color
	 * @return {Undefined}
	*/
	/* istanbul ignore next */
	log (messages, collapse = false, color = 'green') {
		if (collapse) {
			console.groupCollapsed(this.name)
		} else {
			console.group(this.name)
		}

		messages.forEach(message => {
			console.log('%c%s', 'color:' + color, message)
		})

		console.groupEnd()
	}

	/**
	 * Log group messages to console
	 * @param {Array[String]} messages
	 * @param {String} color
	 * @return {Undefined}
	*/
	/* istanbul ignore next */
	logGroup (group, messages, color = 'green') {
		console.group(this.name)
		console.groupCollapsed(group)

		messages.forEach(message => {
			console.log('%c%s', 'color:' + color, message)
		})

		console.groupEnd()
		console.groupEnd()
	}

}
