// The DeviceQueue provides a debounce to any device function, preventing it from
// running multiple times if called in rapid succession.

class DeviceQueue {
	constructor(debounceTime = 200) {
		this._queue = new Map();
		this._debounceTime = debounceTime;
	}

	queue(device, func, args) {
		if (!this._queue.has(device)) {
			this._queue.set(device, new Map());
		}
		
		let deviceMap = this._queue.get(device);
		if (!deviceMap.has(func)) {
			let resolveCallback , rejectCallback;
			// TODO: Check side-effects of returning a promise
			// If the same person queues a function five times, should
			// we attach new then() callbacks five times?
			let promise = new Promise((resolve, reject) => {
				resolveCallback = resolve;
				rejectCallback = reject;
			});
			
			deviceMap.set(func, {promise: promise, resolve: resolveCallback, reject: rejectCallback});
		}
		
		let functionObject = deviceMap.get(func);
		if (functionObject.timeoutID) {
			clearTimeout(functionObject.timeoutID);
		}
		functionObject.arguments = args;
		functionObject.timeoutID = setTimeout(() => {
			this._dequeue(device, func);
		}, this._debounceTime);
		
		return functionObject.promise;
	}
	
	async _dequeue(device, func) {
		if (this._queue.has(device)) {
			let deviceMap = this._queue.get(device);
			if (deviceMap.has(func)) {
				let functionObject = deviceMap.get(func);
				deviceMap.delete(func);
				
				try {
					let result = await device[func].apply(device, functionObject.arguments);
					functionObject.resolve(result);
				} catch (error) {
					functionObject.reject(error);
				}
			} else {
				throw new Error('Attempted to run a non-queued function on a device!')
			}
		} else {
			throw new Error('Attempted to run a function on a non-queued device!')
		}
	}
}

module.exports = DeviceQueue;
