const particle = new Particle();
let token;
const deviceID = "29002b000b47313037363132";

particle.login({ username: 'correo', password: 'contraseña' }).then(
    (data) => {
        token = data.body.access_token;
        console.log("Autenticación exitosa.");
        fetchSensorData();
    },
    (err) => {
        console.error("Error al iniciar sesión:", err);
    }
);

function fetchSensorData() {
    particle.getEventStream({ deviceId: deviceID, name: 'sensorData', auth: token }).then(
        (stream) => {
            stream.on('event', (event) => {
                const data = JSON.parse(event.data);
                console.log("Datos recibidos:", data);

                document.getElementById('tempC').textContent = data.tempC.toFixed(1);
                document.getElementById('tempF').textContent = data.tempF.toFixed(1);
                document.getElementById('humidity').textContent = data.humidity.toFixed(1);
                document.getElementById('heatIndex').textContent = data.heatIndex.toFixed(1);
                document.getElementById('gasLevel').textContent = data.gasPPM;

                checkAlarms(data.tempC, data.gasPPM); 
            });
        },
        (err) => {
            console.error("Error al recibir datos:", err);
        }
    );
}

function updateThresholds() {
    const tempThreshold = parseFloat(document.getElementById('tempThreshold').value);
    const gasThreshold = parseFloat(document.getElementById('gasThreshold').value);

    particle.callFunction({
        deviceId: deviceID,
        name: 'setTempThreshold',
        argument: String(tempThreshold),
        auth: token
    }).then(
        (data) => {
            console.log("Umbral de temperatura actualizado:", data);
        },
        (err) => {
            console.error("Error al actualizar el umbral de temperatura:", err);
        }
    );

    particle.callFunction({
        deviceId: deviceID,
        name: 'setGasThreshold',
        argument: String(gasThreshold),
        auth: token
    }).then(
        (data) => {
            console.log("Umbral de gas actualizado:", data);
        },
        (err) => {
            console.error("Error al actualizar el umbral de gas:", err);
        }
    );
}

function checkAlarms(tempC, gasLevel) {
    const tempThreshold = parseFloat(document.getElementById('tempThreshold').value);
    const gasThreshold = parseFloat(document.getElementById('gasThreshold').value);
    const alarmStatus = document.getElementById('alarmStatus');

    if (tempC >= tempThreshold) {
        alarmStatus.textContent = 'ALERTA: Temperatura alta detectada!';
        alarmStatus.className = 'alarm';
    } else if (gasLevel >= gasThreshold) {
        alarmStatus.textContent = 'ALERTA: Nivel de gas/humo alto detectado!';
        alarmStatus.className = 'alarm';
    } else {
        alarmStatus.textContent = 'Estado: Normal';
        alarmStatus.className = 'normal';
    }
}
