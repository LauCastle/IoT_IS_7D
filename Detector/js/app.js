let tempThreshold = 35;
let gasThreshold = 5;

function updateThresholds() {
    tempThreshold = parseFloat(document.getElementById('tempThreshold').value);
    gasThreshold = parseFloat(document.getElementById('gasThreshold').value);
    checkAlarms();
}

function simulateReading() {
    const tempC = (Math.random() * 40).toFixed(1);
    const tempF = (tempC * 9/5 + 32).toFixed(1);
    const heatIndex = (parseFloat(tempC) + Math.random() * 5).toFixed(1);
    const gasLevel = Math.floor(Math.random() * 20);

document.getElementById('tempC').textContent = tempC;
    document.getElementById('tempF').textContent = tempF;
    document.getElementById('heatIndex').textContent = heatIndex;
    document.getElementById('gasLevel').textContent = gasLevel;

checkAlarms();
}

function checkAlarms() {
    const tempC = parseFloat(document.getElementById('tempC').textContent);
    const gasLevel = parseFloat(document.getElementById('gasLevel').textContent);
    const alarmStatus = document.getElementById('alarmStatus');

if (tempC >= tempThreshold) {
        alarmStatus.textContent = 'ALARM: High temperature detected!';
    } else if (gasLevel >= gasThreshold) {
        alarmStatus.textContent = 'ALARM: High gas/smoke level detected!';
    } else {
        alarmStatus.textContent = 'Status: Normal';
    }
}
simulateReading();