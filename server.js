const fs = require('fs');
var lineReader = require('line-reader');
const application = require('express')();
 const cron = require("node-cron");
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

discover.on('deviceAdded', (device) => {
	console.log(device);
	const yeelight = new Yeelight({lightIp: device.host, lightPort: device.port});
// Attempt to serve any file
require(`${Directory.SELF}StaticFileServer.js`)(application, Directory);

	yeelight.on('error', (error) => {
		if (error.code == 'EHOSTUNREACH') {
			return;
		}
		
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
    
	socket.on('set_event', (value) => {
        let day = value["day"];
        let hour = value["hour"];
        let minute = value["minute"];
        let cron_string = minute + " " + hour + " * * " + day;
        console.log("task set for" + cron_string + "(min hr dayofmonth month dayofweek)");
        
        create_alert(cron_string);
        
        fs.appendFile("static/alerts/alerts.txt", cron_string + "\n", function(err){
            if(err) throw err;
            console.log("file written");
        });
        

	});
    
    read_in_existing_alerts();
    
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

//cron alert functions
function create_alert(cron_string){
    cron.schedule(cron_string, function() {
        
        console.log("job done!");
        for (let [, {device: yeelight}] of devices) {
            (async () => {
                try {
                    await deviceQueue.queue(yeelight, 'toggle');

                } catch (error) {
                    console.log(error);
                }
            })();
        }      
        console.log("task originally set for" + cron_string + "(min hr dayofmonth month dayofweek)");
        var d = new Date();
        console.log("current time is day: " + d.getDay() + " hour: " + d.getHours() + " minutes: " + d.getMinutes());
    });
}

function read_in_existing_alerts(){
    if(fs.existsSync('static/alerts/alerts.txt')){
        lineReader.eachLine('static/alerts/alerts.txt', function(line, last) {
          create_alert(line);
          console.log("added alert from alert file for: ", line);
          if(last){
            console.log("finished reading in existing alerts");
          }
        });
        
    }
}
