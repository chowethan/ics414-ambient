let altitude = 0;
let r_medium = 0.0225;
let r_large = 0.0233;
let alpha = 1.53e-7;

let pressure_at_sealevel = 101325; // in pascals
let boiling_point_at_sealevel = 373.15; //in kelvin

let currentPressure = 0;

let temperature = 0;
let heat_of_vaporization = 40660;

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

function toggleAdvancedOptions() {
	let optionsContainer = document.getElementById('advanced-options');
	let toggle = document.getElementById('toggle-advanced-options');
	
	if (optionsContainer.dataset.visible == 1) {
		optionsContainer.style.display = 'none';
		optionsContainer.dataset.visible = null;
		toggle.innerHTML = 'Show Advanced Options';
	} else {
		optionsContainer.style.display = '';
		optionsContainer.dataset.visible = 1;
		toggle.innerHTML = 'Hide Advanced Options';
	}
}

function getEggTemperature() {
	let simpleEggTemperature = document.getElementById('approx_egg_temp');
	let advancedEggTemperature = document.getElementById('exact_egg_temp');
	
	if (advancedEggTemperature.value.trim().length > 0) {
		if (parseFloat(advancedEggTemperature.value)) {
			return parseFloat(advancedEggTemperature.value);
		}
	}
	
	return parseFloat(simpleEggTemperature.value);
}

function getLocationAltitude() {
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

//*************************** get the temperature from national weather service *************
function getLocationTemperature() {
	let location;
	if (navigator.geolocation) {
		location = navigator.geolocation;
		console.log(location.getCurrentPosition(getForecast));
	} else { 
		console.log('position not found');
	}
}

//a latitude and longitude point will not return forecast data, just a way to get actual forecast data
async function getForecast(position) {
    console.log("lat: " + position.coords.latitude);
    console.log("long: "+ position.coords.longitude);
    const url = `https://api.weather.gov/points/${position.coords.latitude},${position.coords.longitude}`;
    let data = await getJSON(url, false);
    console.log(data);
    console.log(data.properties.forecast);
    getTemperature(data.properties.forecast);
}

//feed result url from getForecast(position) to get temperature
    //this also has an altitude interestingly
function getTemperature(forecastUrl){
    const Http = new XMLHttpRequest();
    const url=forecastUrl;
    Http.open("GET", url);
    Http.send();
    Http.onreadystatechange=(e)=>{
        let response_txt = Http.responseText;
        response_txt = '[' + response_txt + ']';
        let forecast = JSON.parse(response_txt);
        temperature = forecast[0]["properties"]["periods"][0]["temperature"]
        console.log(temperature);
    }
}

function getEggTime(type) {
	if (type == 1) {
		return 20 * 60 * 1000;
	} else if (type == 2) {
		return 10 * 60 * 1000;
	} else {
		return 5 * 60 * 1000;
	}
}

function getEggTimeEqn(){
    let water_temp = document.getElementById('exact_water_temp').value;
    let egg_temp_target = document.getElementById('target_egg_temp').value;
    //let eggSize = document.getElementById('eggSize');
    return calculateCookTime(water_temp, egg_temp_target, getEggTemperature(), r_large, alpha);
}

function calculateCookTime(t_b, t_c, t_0, r, alpha) {
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
function getBoilingTempOfWater(currentPressure){
    let r_gas_const = 8.31432;
    let e1 = 1/boiling_point_at_sealevel;
    let e2 = (r_gas_const * log(currentPressure/pressure_at_sealevel))/heat_of_vaporization;
    boiling_temp = 1/(e1-e2);
    //returns temperature water boils at in celcius
    let kelvin = 273.15;
    return (boiling_temp-kelvin); 
}

//more precise way to get pressure, uses temperature and altitude
function getBarometricPressure(){
    let m = 0.0289644;
    let r_gas_const = 8.31432;
    let g = 9.80665;
    let exp_value = (-m*g*altitude)/(r*temperature)
    return 101325*exp(exp_value);
}

//less precise way to get pressure
function getPressure(){
    return 101325*((1-(2.25577e-5)*altitude)**5.25588)
}

document.getElementById('toggle-advanced-options').addEventListener('click', toggleAdvancedOptions);