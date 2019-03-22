const application = require('express')();
const http = require('http');
const server = http.createServer(application);
const socketio = require('socket.io')(server);

const YeelightAwesome = require('yeelight-awesome');
require(`${__dirname}/YeelightAwesomeExtension.js`)(YeelightAwesome);
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

// Attempt to serve any file
require(`${Directory.SELF}StaticFileServer.js`)(application, Directory);

discover.on('deviceAdded', (deviceInfo) => {
	console.log(deviceInfo);
	const yeelight = new Yeelight({lightIp: deviceInfo.host, lightPort: deviceInfo.port});
	let deviceID;

	yeelight.on('error', (error) => {
		if (error.code == 'EHOSTUNREACH') {
			return;
		}
		
		console.log('Yeelight error', error);
	});
	yeelight.on('connected', () => {
		deviceID = devices.size;
		
		console.log(`Device connected with ID ${deviceID}`);
		let clientDeviceInfo = {id: deviceID, model: deviceInfo.model};
		socketio.emit('device-connect', clientDeviceInfo);
		devices.set(deviceID, {device: yeelight, info: clientDeviceInfo});
	});
	yeelight.on('disconnected', () => {
		console.log(`Device disconnected with ID ${deviceID}`);
		socketio.emit('device-disconnect', deviceID);

		devices.delete(deviceID);
	});
	
	yeelight.connect().then((yeelight) => {
		yeelight.autoReconnect = true;
	});
});
discover.start();

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