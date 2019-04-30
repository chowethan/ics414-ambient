const altitude = 0;
const r_medium = 0.0225;
const r_large = 0.0233;
const alpha = 1.53e-7;

const kelvin = 273.15;

const pressure_at_sealevel = 101325; // in pascals
const boiling_point_at_sealevel = 373.15; //in kelvin

const heat_of_vaporization = 40660;

/******************
 * HTTP FUNCTIONS *
 ******************/
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
		if (headers === undefined) {
			request.setRequestHeader('Cache-Control', 'no-cache');
			request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		}

		if (headers instanceof Array) {
			for (let i = 0; i < headers.length; i++) {
				if (headers[i]) {
					request.setRequestHeader(headers[i][0], headers[i][1]);
				}
			}
		}

		request.send(body);
	});
}
	
function getJSON(url, headers) {
	return http_request(url, 'GET', headers, null).then((response, request) => {
		return JSON.parse(response);
	});
}

/********************************
 * LOCATION-DEPENDANT FUNCTIONS *
 ********************************/
function getPosition() {
	if (navigator.geolocation) {
		return new Promise((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(resolve, reject);
		});
	} else {
		console.log('Geolocation API not supported!');
		return Promise.reject(new Error('Geolocation API not supported!'));
	}
}

// Gets the altitude, using either the provided Geolocation data, or an external API if unavailable
async function getAltitude(position) {
	let altitude = position.coords.altitude;
	
	// Only use external API to obtain altitude if Geolocation API implementation does not provide it
	if (altitude === null) {
		console.log('No altitude provided by geolocation, using fallback API');
		let data = await getJSON(`https://elevation-api.io/api/elevation?points=(${position.coords.latitude},${position.coords.longitude})`);
		altitude = data.elevations[0].elevation;
	}
	
	console.log(`Altitude: ${altitude}`);
	return altitude;
}

// Gets the temperature from the National Weather Service
async function getTemperature(position) {
	let weatherData = await getJSON(`https://api.weather.gov/points/${position.coords.latitude},${position.coords.longitude}`, false);
	console.log(weatherData);
	let forecastURL = weatherData.properties.forecast;
	let forecastData = await getJSON(forecastURL, false);
	let temperature = forecastData['properties']['periods'][0]['temperature'];
	
	if (temperature === null) {
		return null;
	}
	// Convert Fahrenheit to elcius
	temperature = (temperature - 32) * (5/9);
	
	console.log(`Air temperature (°C): ${temperature}`);
	return temperature;
}

function getPressure(altitude, temperature) {
	if (temperature === null) {
		// Less precise way to calculate pressure, using only altitude
		return 101325 * ((1 - (2.25577e-5) * altitude) ** 5.25588);
	} else {
		// More precise way to calculate barometric pressure, using altitude and temperature
		let m = 0.0289644;
		let r_gas_const = 8.31432;
		let g = 9.80665;
		
		// Convert Celcius to Kelvin
		temperature = temperature + kelvin;
		let exp_value = (-m * g * altitude) / (r_gas_const * (temperature));
		return 101325 * Math.exp(exp_value);
	}
}

/*****************************
 * INPUT RETRIEVAL FUNCTIONS *
 *****************************/
function getInitialEggTemperatureInput() {
	let simpleValue = document.getElementById('approx_egg_temp').value;
	let advancedValue = document.getElementById('exact_egg_temp').value;
	
	if (!isNaN(parseFloat(advancedValue))) {
		return parseFloat(advancedValue);
	}
	
	return parseFloat(simpleValue);
}

function getTargetEggTemperatureInput() {
	let simpleValue = document.getElementById('simple_egg_temp').value;
	let advancedValue = document.getElementById('exact_egg_temp').value;
	
	if (!isNaN(parseFloat(advancedValue))) {
		return parseFloat(advancedValue);
	}
	
	return parseFloat(simpleValue);
}

function getEggSizeInput() {
	let simpleValue = document.getElementById('simple_eggSize').value;
	let advancedValue = document.getElementById('exact_eggSize').value;
	
	if (!isNaN(parseFloat(advancedValue))) {
		return parseFloat(advancedValue) / 2;
	}
	
	return parseFloat(simpleValue);
}

function getWaterTemperatureInput() {
	let water_temp = document.getElementById('exact_water_temp').value;
	
	if (!isNaN(parseFloat(water_temp))) {
		return parseFloat(water_temp);
	}
	
	return 100;  
}

// UNUSED
async function getAltitudeInput(position) {
	let advancedValue = document.getElementById('altitude').value;
	
	if (!isNaN(parseFloat(advancedValue))) {
		return parseFloat(advancedValue);
	}
	
	return await getAltitude(position);  
}

// UNUSED
function getAirPressureInput() {
	let advancedValue = document.getElementById('air_pressure').value;
	
	if (!isNaN(parseFloat(advancedValue))) {
		return parseFloat(advancedValue);
	}
	
	return 100;  
}

/*************
 * EQUATIONS *
 *************/
function calculateCookTime() {
	let t_b = getWaterTemperatureInput();
	let t_c = getTargetEggTemperatureInput();
	let t_0 = getInitialEggTemperatureInput();
	let r = getEggSizeInput();
	
	//t_b is temperature of the water
	//t_c is desired egg temperature
	//t_0 is initial egg temperature
	//r is radius of sphere used to approximate egg shape in meters
	//alpha is a parameter determined to be 1.53e-7
	
	//the equation is split into two parts so its easier (hopefully to understand)
	let e1 = (r ** 2) / ((Math.PI ** 2) * alpha);
	let e2 = (Math.log((t_b - t_0) / (t_b - t_c))) ** 2;
	//time is in seconds, so it needs ot be converted into milliseconds for the timer
	let time = e1 * e2 * 1000;
	
	return time;
}

// use the claudius clapyron equation to get temperature water boils at at different altitude
function getBoilingTempOfWater(pressure){
	let r_gas_const = 8.31432;
	let e1 = 1 / boiling_point_at_sealevel;
	let e2 = (r_gas_const * Math.log(pressure / pressure_at_sealevel)) / heat_of_vaporization;
	boiling_temp = 1 / (e1 - e2);
	//returns temperature water boils at in celcius
	return boiling_temp - kelvin; 
}

/*************
 * UTILITIES *
 *************/
function toggleAdvancedOptions(show) {
	let optionsContainer = document.getElementById('advanced-options');
	let toggle = document.getElementById('toggle-advanced-options');
	
	if (show === undefined) {
		show = optionsContainer.dataset.visible == 1 ? false : true;
	}
	
	if (show === false) {
		optionsContainer.style.display = 'none';
		optionsContainer.dataset.visible = null;
		toggle.innerHTML = 'Show Advanced Options';
	} else if (show === true) {
		optionsContainer.style.display = '';
		optionsContainer.dataset.visible = 1;
		toggle.innerHTML = 'Hide Advanced Options';
	}
}

async function getParametersFromLocation() {
	let spinner = document.getElementById('spinner');
	spinner.style.display = '';
	
	toggleAdvancedOptions(true);
		
	try {
		let position = await getPosition();
		let altitude = await getAltitude(position);
		let airTemperature = await getTemperature(position);
		let pressure = getPressure(altitude, airTemperature);
		let waterTemperature = getBoilingTempOfWater(pressure);
		
		document.getElementById('altitude').value = altitude;
		document.getElementById('air_pressure').value = pressure;
		document.getElementById('exact_water_temp').value = waterTemperature;
	} catch (error) {
		console.log('Failed to obtain location.');
		console.log(error);
	}
	
	spinner.style.display = 'none';
}

document.getElementById('toggle-advanced-options').addEventListener('click', () => {
	toggleAdvancedOptions();
});
document.getElementById('location').addEventListener('click', getParametersFromLocation);
