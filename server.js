const application = require('express')();
const http = require('http');
const server = http.createServer(application);
const socketio = require('socket.io')(server);

const YeelightAwesome = require('yeelight-awesome');
const Discover = YeelightAwesome.Discover;
const Yeelight = YeelightAwesome.Yeelight
const discover = new Discover({port: 1982, debug: true});
const devices = new Map();

const listenPort = process.env.PORT || 8080;
const listenAddress = '0.0.0.0';

discover.on('deviceAdded', (device) => {
	console.log(device);
	const yeelight = new Yeelight({lightIp: device.host, lightPort: device.port});

	yeelight.connect().then((yeelight) => {
		yeelight.autoReconnect = true;
		devices.set(device.id, {device: yeelight, info: device});
		socketio.emit('device-connect', device);
		
		yeelight.on('error', (error) => {
			async function retry() {
				await yeelight.connect().then(() => {
					resolve();
				}).catch(() => {
					setTimeout(() => {
						resolve();
						retry();
					}, 5000);
				});
			}
			
			retry();
		});
		yeelight.on('disconnected', () => {
			socketio.emit('device-disconnect', device.id);
			
			devices.delete(device.id);
		});
	});
});
discover.start();

application.get('/', async (request, response) => {
	response.sendFile(`${__dirname}/index.html`);
});

application.get('/api/toggle', async (request, response) => {
	for (let [, {device: yeelight}] of devices) {
		(async () => {
			try {
				await yeelight.toggle();
			} catch (error) {
				console.log(error);
			}
		})();
	}
	
	response.send('');
});

application.get('/api/temperature/:value', async (request, response) => {
	for (let [, {device: yeelight}] of devices) {
		(async () => {
			try {
				await yeelight.setCtAbx(parseInt(request.params.value, 10), 'sudden');
			} catch (error) {
				console.log(error);
			}
		})();
	}
	
	response.send('');
});

application.get('/api/brightness/:value', async (request, response) => {
	for (let [, {device: yeelight}] of devices) {
		(async () => {
			try {
				await yeelight.setBright(parseInt(request.params.value, 10), 'sudden');
			} catch (error) {
				console.log(error);
			}
		})();
	}
	
	response.send('');
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
					await yeelight.toggle();
				} catch (error) {
					console.log(error);
				}
			})();
		}
	});
	
	socket.on('temperature', (temperature) => {
		for (let [, {device: yeelight}] of devices) {
			(async () => {
				try {
					await yeelight.setCtAbx(temperature, 'sudden');
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