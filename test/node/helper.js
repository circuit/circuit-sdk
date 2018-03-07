'use strict';

(function (root, factory) {
	if (typeof module === 'object' && module.exports) {
			module.exports = factory();
	} else {
		root.helper = factory();
	}
}(typeof self !== 'undefined' ? self : this, function () {

	function remove(array, element) {
		const index = array.indexOf(element);
		array.splice(index, 1);
	}

	/**
	 * Delay processing. Returns a promise.
	 * @param {Number} ms Time to sleep in ms
	 */
	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * expectEvents
	 * @param {Object} client Circuit client instance
	 * @param {Object[]} events Array with event type and optional predicate function
	 * @returns {Promise}
	 */
	function expectEvents(client, events) {
		return new Promise((resolve, reject) => {
			events = events.map(e =>
				typeof e === 'string' ? { type: e, predicate: () => { return true; } } : e
			)
			events.forEach(event => client.addEventListener(event.type, evt => {
				const matchingEvents = events.filter(e => e.type === evt.type);
				if (matchingEvents.length) {
					const resolvedEvents = matchingEvents.filter(me => !me.predicate || me.predicate(evt));
					resolvedEvents.forEach(re => remove(events, re));
					!events.length && resolve(evt);
				}
			}));
		});
	}

	function logEvents(client, events) {
		events.forEach(e =>
			client.addEventListener(e, evt => {
				let msg = `Received ${e} event.`;
				evt.reason && (msg += ` Reason: ${evt.reason}.`);
				evt.call && (msg += ` State: ${evt.call.state}.`);
				console.log(msg);
			})
		);
	}

	async function assertThrowsAsync(fn, regExp) {
		let f = () => {};
		try {
			await fn();
		} catch(e) {
			f = () => {throw e};
		} finally {
			assert.throws(f, regExp);
		}
	}

	return {
		sleep: sleep,
		logEvents: logEvents,
		expectEvents: expectEvents,
		assertThrowsAsync: assertThrowsAsync
	};
}));
