let altitude = 0;
let r_medium = 0.0225;
let r_large = 0.0223;
let alpha = 1.53e-7;
function getLocation() {
    let location;
    document.getElementById("loc").innerHTML = "Currently Obtaining your altitude";
    if (navigator.geolocation) {
        location = navigator.geolocation;
        console.log(location.getCurrentPosition(getAltitude));
    } else { 
        console.log("position not found");
    }
}
function getAltitude(position) {
    altitude = position.coords.altitude;
    // document.getElementById("loc").innerHTML = altitude + " meters";
    const Http = new XMLHttpRequest();
    const url='https://elevation-api.io/api/elevation?points=('+ position.coords.latitude +"," + position.coords.longitude + ')';
    Http.open("GET", url);
    Http.send();
    Http.onreadystatechange=(e)=>{
        let response_txt = Http.responseText;
        response_txt = '[' + response_txt + ']';
        let value = JSON.parse(response_txt);
        altitude = value[0].elevations[0].elevation;
        document.getElementById("loc").innerHTML = "Your altitude is: " + altitude + " meters";
    }
}

function calculateCookTime(t_b, t_c, t_0, r, alpha){
    //t_b is temperature of the water
    //t_c is desired egg temperature
    //t_0 is initial egg temperature
    e1 = (r**2)/( (math.pi**2)*alpha)
    e2 = (math.log( (t_b-t_0) / (t_b-t_0) ))**2;
    //time is in seconds, so it needs ot be converted into milliseconds for the timer
    time = e1 * e2 * 1000;
}