const fs = require('fs');
const application = require('express')();
const http = require('http');
const server = http.createServer(application);
const socketio = require('socket.io')(server);

const YeelightAwesome = require('yeelight-awesome');
const Discover = YeelightAwesome.Discover;
const Yeelight = YeelightAwesome.Yeelight
// DeviceQueue is used to help avoid hitting the 60/60 second command quota
const DeviceQueue = require(`${__dirname}/DeviceQueue.js`);
const discover = new Discover({port: 1982, debug: true});
const devices = new Map();
const deviceQueue = new DeviceQueue();

const Directory = {};
Directory.SELF = `${__dirname}/`;
Directory.STATIC = `${Directory.SELF}static/`;
const listenPort = process.env.PORT || 8080;
const listenAddress = '0.0.0.0';

discover.on('deviceAdded', (device) => {
	console.log(device);
	const yeelight = new Yeelight({lightIp: device.host, lightPort: device.port});

	yeelight.on('error', (error) => {
		console.log('Yeelight error', error);
	});
	yeelight.on('connected', () => {
		console.log('Connected');
		socketio.emit('device-connect', device);

		devices.set(device.id, {device: yeelight, info: device});
	});
	yeelight.on('disconnected', () => {
		console.log('Disconnected');
		socketio.emit('device-disconnect', device.id);

		devices.delete(device.id);
	});
	
	yeelight.connect().then((yeelight) => {
		yeelight.autoReconnect = true;
	});
});
discover.start();

// Attempt to serve any file
application.use(async (request, response, next) => {
	let path = request.path;
	// Removes the leading slash
	let internalPath = Directory.STATIC + path.substring('/'.length);
	
	if (path.charAt(path.length - 1) == '/') {
		// Try to route to an index if the request is for a directory
		internalPath += 'index';
	}
	
	// Look for a file with the same path but with the .html extension appended
	// This allows /test to point to /test.html
	fs.access(internalPath + '.html', fs.constants.R_OK, (error) => {
		if (error) {
			// Look for the explicit file
			fs.access(internalPath, fs.constants.R_OK, (error) => {
				if (error) {
					let httpError = new Error('404 Not Found');
					httpError.status = 404;

					// Trigger the error handler chain
					next(httpError);
					
					return;
				}
				
				let redirect = undefined;
				
				// Redirect any relative /index.html to just the relative /
				// Redirect any .html file to the URL without the extension
				if (path.substring(path.length - '/index.html'.length) == '/index.html') {
					redirect = path.substring(0, path.length - 'index.html'.length);
				} else if (path.substring(path.length - '.html'.length) == '.html') {
					redirect = path.substring(0, path.length - '.html'.length);
				}
					
				if (redirect !== undefined) {
					// Send a 301 Moved Permanently
					response.statusCode = 301;
					response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
					response.setHeader('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
					response.setHeader('Location', redirect);
					response.send('');
				} else {
					// Send the file
					response.sendFile(internalPath);
				}
			});
			
			return;
		}
		
		let redirect = undefined;
		
		// Redirect any relative /index to just the relative /
		if (path.substring(path.length - '/index'.length) == '/index') {
			redirect = path.substring(0, path.length - 'index'.length);
		}
		
		if (redirect !== undefined) {
			// Send a 301 Moved Permanently
			response.statusCode = 301;
			response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
			response.setHeader('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
			response.setHeader('Location', redirect);
			response.send('');
		} else {
			// Send the file
			response.sendFile(internalPath + '.html');
		}
	});
});

// Handle errors
application.use(async (mainError, request, response, next) => {
	// Return the correct status code header
	response.statusCode = mainError.status
	
	// Send a plain text error
	response.setHeader('Content-Type', 'text/plain');
	response.send('');
//	response.send(`${errorType.code} ${errorType.name}`);
});

socketio.on('connection', (socket) => {
	let deviceInfo = [];
	for (let [, {info}] of devices) {
		deviceInfo.push(info);
	}
	
	socket.emit('devices', deviceInfo);
	
	socket.on('toggle', () => {
		for (let [, {device: yeelight}] of devices) {
			(async () => {
				try {
					await deviceQueue.queue(yeelight, 'toggle');
//					await yeelight.toggle();
				} catch (error) {
					console.log(error);
				}
			})();
		}
	});
	
	socket.on('temperature', (value) => {
		for (let [, {device: yeelight}] of devices) {
			(async () => {
				try {
					await deviceQueue.queue(yeelight, 'setCtAbx', [value, 'smooth', 250]);
//					await yeelight.setCtAbx(value, 'sudden');
				} catch (error) {
					console.log(error);
				}
			})();
		}
	});
	
	socket.on('brightness', (value) => {
		for (let [, {device: yeelight}] of devices) {
			(async () => {
				try {
					await deviceQueue.queue(yeelight, 'setBright', [value, 'smooth', 250]);
//					await yeelight.setBright(value, 'sudden');
				} catch (error) {
					console.log(error);
				}
			})();
		}
	});
});

server.listen(listenPort, listenAddress, () => {
	console.log(`Listening on ${listenAddress}:${listenPort}`);
});

process.on('unhandledRejection', error => {
	console.log('Caught unhandledRejection');
	console.log(error);
});

process.on('SIGINT', async () => {
	for (let [, {device: yeelight}] of devices) {
		try {
			await yeelight.disconnect();
		} catch (error) {
			console.log(error);
		}
	}
	
	discover.destroy();
	
	process.exit(0);
});