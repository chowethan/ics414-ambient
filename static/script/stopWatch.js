let timeInterval;
let running = false;

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


function clearTimer() {
	clearInterval(timeinterval);
	setInitialClock();
    running = false;
}


function setInitialClock() {
	var clock = document.getElementById('clockdiv');
	var minutesSpan = clock.querySelector('.minutes');
	var secondsSpan = clock.querySelector('.seconds');
	minutesSpan.innerHTML = '0';
	secondsSpan.innerHTML = '0';
}


function startTimer() {
    if(!running){
        let eggType = parseInt(document.getElementById('eggType').value);
        //let deadline = getEggTime(eggType) + performance.now();
		console.log(getEggTimeEqn());
        let deadline = getEggTimeEqn() + performance.now();
        initializeClock('clockdiv', deadline);
        running = true;
    }
}

setInitialClock();
