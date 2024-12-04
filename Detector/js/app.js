const particle = new Particle();
let token;
const deviceID = "";

const maxDataPoints = 20;
let tempCData = [];
let tempFData = [];
let humidityData = [];
let heatIndexData = [];
let gasData = [];

let chart;

function initializeChart() {
    const storedData = JSON.parse(localStorage.getItem('sensorData'));
    if (storedData) {
        tempCData = storedData.tempCData || [];
        tempFData = storedData.tempFData || [];
        humidityData = storedData.humidityData || [];
        heatIndexData = storedData.heatIndexData || [];
        gasData = storedData.gasData || [];
    }

    const options = {
        series: [{
            name: 'Temperatura (°C)',
            data: tempCData
        }, {
            name: 'Temperatura (°F)',
            data: tempFData
        }, {
            name: 'Humedad (%)',
            data: humidityData
        }, {
            name: 'Índice de Calor (°C)',
            data: heatIndexData
        }, {
            name: 'Nivel de Gas (ppm)',
            data: gasData
        }],
        chart: {
            height: 350,
            type: 'area'
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth'
        },
        xaxis: {
            type: 'datetime'
        },
        tooltip: {
            x: {
                format: 'dd/MM/yy HH:mm:ss'
            },
        },
    };

    chart = new ApexCharts(document.querySelector("#chart"), options);
    chart.render();
}


particle.login({ username: 'correo', password: 'contraseña' }).then(
    (data) => {
        token = data.body.access_token;
        console.log("Autenticación exitosa.");
        initializeChart();
        getInitialThresholds();
        fetchSensorData();
    },
    (err) => {
        console.error("Error al iniciar sesión:", err);
    }
);

function updateChart(data) {
    const timestamp = new Date().getTime();

    tempCData.push([timestamp, data.tempC]);
    tempFData.push([timestamp, data.tempF]);
    humidityData.push([timestamp, data.humidity]);
    heatIndexData.push([timestamp, data.heatIndex]);
    gasData.push([timestamp, data.gasPPM]);

    if (tempCData.length > maxDataPoints) {
        tempCData.shift();
        tempFData.shift();
        humidityData.shift();
        heatIndexData.shift();
        gasData.shift();
    }

    const storedData = {
        tempCData,
        tempFData,
        humidityData,
        heatIndexData,
        gasData,
    };
    localStorage.setItem('sensorData', JSON.stringify(storedData));

    chart.updateSeries([
        { data: tempCData },
        { data: tempFData },
        { data: humidityData },
        { data: heatIndexData },
        { data: gasData },
    ]);
}


function fetchSensorData() {
    particle.getEventStream({ deviceId: deviceID, name: 'sensorData', auth: token }).then(
        (stream) => {
            stream.on('event', (event) => {
                const data = JSON.parse(event.data);
                console.log("Datos recibidos:", data);

                // Actualiza los valores actuales en la interfaz
                document.getElementById('tempC').textContent = data.tempC.toFixed(1);
                document.getElementById('tempF').textContent = data.tempF.toFixed(1);
                document.getElementById('humidity').textContent = data.humidity.toFixed(1);
                document.getElementById('heatIndex').textContent = data.heatIndex.toFixed(1);
                document.getElementById('gasLevel').textContent = data.gasPPM;

                // Actualiza el gráfico y verifica las alarmas
                updateChart(data);
                checkAlarms(data.tempC, data.gasPPM);

                // Actualiza la tabla de historial en tiempo real
                const newData = {
                    timestamp: new Date().getTime(),
                    tempC: data.tempC,
                    tempF: data.tempF,
                    humidity: data.humidity,
                    heatIndex: data.heatIndex,
                    gas: data.gasPPM
                };
                updateHistoryTable(newData);
            });
        },
        (err) => {
            console.error("Error al recibir datos:", err);
        }
    );
}

function getInitialThresholds() {
    particle.callFunction({
        deviceId: deviceID,
        name: 'setTempThreshold',
        argument: '',
        auth: token
    }).then(
        (data) => {
            const tempThreshold = parseFloat(data.body.return_value);
            document.getElementById('tempThreshold').value = tempThreshold;
            console.log("Umbral de temperatura sincronizado:", tempThreshold);
        },
        (err) => {
            console.error("Error al obtener el umbral de temperatura:", err);
        }
    );
    particle.callFunction({
        deviceId: deviceID,
        name: 'setGasThreshold',
        argument: '',
        auth: token
    }).then(
        (data) => {
            const gasThreshold = parseFloat(data.body.return_value);
            document.getElementById('gasThreshold').value = gasThreshold;
            console.log("Umbral de gas sincronizado:", gasThreshold);
        },
        (err) => {
            console.error("Error al obtener el umbral de gas:", err);
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

let isHistoryVisible = false;

function showHistoricalData() {
    const storedData = JSON.parse(localStorage.getItem('sensorData'));
    if (!storedData) {
        alert("No hay datos históricos disponibles.");
        return;
    }

    const table = document.getElementById('historyTable');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = ''; // Limpia la tabla antes de llenarla

    const combinedData = storedData.tempCData.map((_, index) => ({
        timestamp: new Date(storedData.tempCData[index][0]).toLocaleString(),
        tempC: storedData.tempCData[index][1],
        tempF: storedData.tempFData[index][1],
        humidity: storedData.humidityData[index][1],
        heatIndex: storedData.heatIndexData[index][1],
        gas: storedData.gasData[index][1],
    }));

    combinedData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.timestamp}</td>
            <td>${row.tempC.toFixed(1)}</td>
            <td>${row.tempF.toFixed(1)}</td>
            <td>${row.humidity.toFixed(1)}</td>
            <td>${row.heatIndex.toFixed(1)}</td>
            <td>${row.gas.toFixed(1)}</td>
        `;
        tbody.appendChild(tr);
    });

    if (isHistoryVisible) {
        table.style.display = 'none';
    } else {
        table.style.display = 'table';
    }
    isHistoryVisible = !isHistoryVisible;
}



function updateHistoryTable(newData) {
    const table = document.getElementById('historyTable');
    const tbody = table.querySelector('tbody');

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${new Date(newData.timestamp).toLocaleString()}</td>
        <td>${newData.tempC.toFixed(1)}</td>
        <td>${newData.tempF.toFixed(1)}</td>
        <td>${newData.humidity.toFixed(1)}</td>
        <td>${newData.heatIndex.toFixed(1)}</td>
        <td>${newData.gas.toFixed(1)}</td>
    `;
    tbody.appendChild(tr);
}

document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
function clearHistory() {
    localStorage.removeItem('sensorData');
    
    const table = document.getElementById('historyTable');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = ''; 

}


function exportDataToCSV() {
    const storedData = JSON.parse(localStorage.getItem('sensorData'));
    if (!storedData) {
        alert("No hay datos para exportar.");
        return;
    }

    const combinedData = storedData.tempCData.map((_, index) => ({
        timestamp: new Date(storedData.tempCData[index][0]).toISOString(),
        tempC: storedData.tempCData[index][1],
        tempF: storedData.tempFData[index][1],
        humidity: storedData.humidityData[index][1],
        heatIndex: storedData.heatIndexData[index][1],
        gas: storedData.gasData[index][1],
    }));

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fecha y Hora,Temperatura (°C),Temperatura (°F),Humedad (%),Índice de Calor (°C),Nivel de Gas (ppm)\n";

    combinedData.forEach(row => {
        const rowArray = [row.timestamp, row.tempC, row.tempF, row.humidity, row.heatIndex, row.gas];
        csvContent += rowArray.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'datos_sensores.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
