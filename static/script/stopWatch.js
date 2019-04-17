let timeInterval;

function getTimeRemaining(endtime) {
  var t = endtime - performance.now();
  var seconds = Math.floor((t / 1000) % 60);
  var minutes = Math.floor((t / 1000 / 60) % 60);
  return {
    'total': t,
    'minutes': minutes,
    'seconds': seconds
  };
}

function initializeClock(id, endtime) {
    var clock = document.getElementById(id);
    var minutesSpan = clock.querySelector('.minutes');
    var secondsSpan = clock.querySelector('.seconds');

    function updateClock() {
        var t = getTimeRemaining(endtime);

        minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
        secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

        if (t.total <= 0) {
          clearTimer();
        }
  }
  updateClock();
  timeinterval = setInterval(updateClock, 1000);
}

function clearTimer(){
    clearInterval(timeinterval);
    setInitialClock();
}

function setInitialClock(){
    var clock = document.getElementById('clockdiv');
    var minutesSpan = clock.querySelector('.minutes');
    var secondsSpan = clock.querySelector('.seconds');
    minutesSpan.innerHTML = '0';
    secondsSpan.innerHTML = '0';
}

function startTimer(){
    let eggType = parseInt(document.getElementById("eggType").value);
    let deadline = getEggTime(eggType) + performance.now();
    initializeClock('clockdiv', deadline);
}

function getEggTime(type){
    if(type == 1){
        return 20*60*1000;
    }else if(type==2){
        return 10*60*1000;
    }else{
        return 5*60*1000;
    }
    
}


setInitialClock();

   