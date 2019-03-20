function check_weather(){
    const Http = new XMLHttpRequest();
    const url='https://api.weather.gov/gridpoints/HFO/153,144/forecast';
    Http.open("GET", url);
    Http.send();
    Http.onreadystatechange=(e)=>{
    var response_txt = Http.responseText;
    var test2 = JSON.parse(response_txt);
    console.log(test2);
    
    
    }
}