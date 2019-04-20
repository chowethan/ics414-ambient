let altitude = 0;
let r_medium = 0.0225;
let r_large = 0.0223;
let alpha = 1.53e-7;

function http_request(url, method, headers, body) {
	return new Promise((resolve, reject) => {
		let request = new XMLHttpRequest();

		request.addEventListener('load', (event) => {
			resolve(request.responseText);
		});
		request.addEventListener('error', (event) => {
			reject(event);
		});
		request.addEventListener('abort', (event) => {
			reject(event);
		});

		request.open(method, url, true);
		if (!headers || headers[0] !== null) {
			request.setRequestHeader('Cache-Control', 'no-cache');
			request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		}

		if (headers) {
			for (let i = 0; i < headers.length; i++) {
				if (headers[i]) {
					request.setRequestHeader(headers[i][0], headers[i][1]);
				}
			}
		}

		request.send(body);
	});
}
	
function getJSON(url) {
	return http_request(url, 'GET', null, null).then((response, request) => {
		return JSON.parse(response);
	});
};

function getLocation() {
	let location;
	document.getElementById('loc').innerHTML = 'Currently Obtaining your altitude';
	if (navigator.geolocation) {
		location = navigator.geolocation;
		console.log(location.getCurrentPosition(getAltitude));
	} else { 
		console.log('position not found');
	}
}
async function getAltitude(position) {
	altitude = position.coords.altitude;
	// document.getElementById('loc').innerHTML = altitude + ' meters';
	const url = `https://elevation-api.io/api/elevation?points=(${position.coords.latitude},${position.coords.longitude})`;
	
	// Only use external API to obtain altitude if Geolocation API implementation does not provide it
	if (altitude === null) {
		let data = await getJSON(url);
		altitude = data.elevations[0].elevation;
	}
	
	document.getElementById('loc').innerHTML = `Your altitude is: ${altitude} meters`;
}

function getEggTimeEqn(){
    let water_temp = document.getElementById('exact_water_temp').value;
    let egg_temp_target = document.getElementById('target_egg_temp').value;
    //let eggSize = document.getElementById('eggSize');
    let getInitialTemp = document.getElementById('exact_egg_temp').value;
    return calculateCookTime(water_temp, egg_temp_target, getInitialTemp, r_large, alpha);
}

function calculateCookTime(t_b, t_c, t_0, r, alpha) {
	//t_b is temperature of the water
	//t_c is desired egg temperature
	//t_0 is initial egg temperature
	e1 = (r ** 2) / ((Math.PI ** 2) * alpha);
	e2 = (Math.log((t_b - t_0) / (t_b - t_c))) ** 2;
	//time is in seconds, so it needs ot be converted into milliseconds for the timer
	time = e1 * e2 * 1000;
    return time;
}