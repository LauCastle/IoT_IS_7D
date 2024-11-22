const deviceID = "29002b000b47313037363132";
const accessToken = "2c0c1912a242cdeb8c8fb64869573f80d5653b3e";

let tempThreshold = 35;
let gasThreshold = 5;

function updateThresholds() {
    tempThreshold = parseFloat(document.getElementById('tempThreshold').value);
    gasThreshold = parseFloat(document.getElementById('gasThreshold').value);
    checkAlarms();
}

function checkAlarms() {
    const tempC = parseFloat(document.getElementById('tempC').textContent);
    const gasLevel = parseFloat(document.getElementById('gasLevel').textContent);
    const alarmStatus = document.getElementById('alarmStatus');

    if (tempC >= tempThreshold) {
        alarmStatus.textContent = 'ALARM: High temperature detected!';
        alarmStatus.className = 'alarm';
    } else if (gasLevel >= gasThreshold) {
        alarmStatus.textContent = 'ALARM: High gas/smoke level detected!';
        alarmStatus.className = 'alarm';
    } else {
        alarmStatus.textContent = 'Status: Normal';
        alarmStatus.className = 'normal';
    }
}

async function fetchSensorData() {
    const eventSource = new EventSource(
        `https://api.particle.io/v1/devices/${deviceID}/events/sensorData?access_token=${accessToken}`
    );

    eventSource.onmessage = function (event) {
        const data = JSON.parse(event.data);
        console.log("Datos recibidos:", data);

        // Actualizar la interfaz con los datos recibidos
        document.getElementById('tempC').textContent = data.tempC.toFixed(1);
        document.getElementById('tempF').textContent = data.tempF.toFixed(1);
        document.getElementById('heatIndex').textContent = data.heatIndex.toFixed(1);
        document.getElementById('gasLevel').textContent = data.gasPPM;

        checkAlarms(); // Verifica si es necesario activar una alarma
    };

    eventSource.onerror = function (err) {
        console.error("Error al conectar con el evento:", err);
    };
}

// Llamar a la función para iniciar la escucha de datos del dispositivo
fetchSensorData();
