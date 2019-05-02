const socket = io();
let timeInterval, flashInterval;
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
			let temp = 6500;
			
			flashInterval = setInterval(() => {
				if (temp == 6500) {
					temp = 2700;
				} else {
					temp = 6500;
				}
				
				socket.emit('temperature', temp, 1000);
			}, 1000);
			
			clearTimer();
		}
	}
	updateClock();
	timeinterval = setInterval(updateClock, 1000);
}

function clearTimer() {
	clearInterval(timeinterval);
	if (flashInterval) {
		clearInterval(flashInterval);
		socket.emit('temperature', 4200);
	}
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
    if (!running) {
		console.log(calculateCookTime());
        let deadline = calculateCookTime() + performance.now();
        initializeClock('clockdiv', deadline);
        running = true;
    }
}

setInitialClock();
