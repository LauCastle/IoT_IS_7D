// Crear una instancia del SDK de Particle
const particle = new Particle();
let token;
const deviceId = '29002b000b47313037363132'; // Reemplaza con tu Device ID

// Autenticación de usuario
particle.login({username: 'lcastillo13@ucol.mx', password: 'lauada13'}).then(
    function(data) {
        token = data.body.access_token;
        console.log("Login exitoso, token:", token);
        subscribeToParticleEvents();
    },
    function (err) {
        console.log('No se pudo iniciar sesión.', err);
    }
);

// Función para suscribirse a eventos de Particle
function subscribeToParticleEvents() {
    particle.getEventStream({ deviceId: deviceId, name: 'VALOR', auth: token }).then(function(stream) {
        stream.on('event', function(data) {
            updateTMSFromParticle(data.data);
        });
    });
}

// Función para actualizar el valor de TMS en la página
function updateTMSFromParticle(newValue) {
    document.getElementById('tmsResult').textContent = newValue;
}

// Función para enviar el valor del slider a Particle
function sendValueToParticle(value) {
    particle.callFunction({ deviceId: deviceId, name: 'TMS_2', argument: String(value), auth: token }).then(
        function(data) {
            console.log("Valor enviado a Particle:", value);
        }, 
        function(err) {
            console.log('Error al enviar el valor a Particle:', err);
        }
    );
}

// Actualizar el valor del tooltip y enviar el valor a Particle
function updateValue(slider) {
    const tooltip = document.getElementById('tooltip');
    const value = slider.value;
    tooltip.textContent = value;
    
    const sliderWidth = slider.offsetWidth;
    const min = slider.min;
    const max = slider.max;
    
    // Calcular la posición del tooltip
    const percentage = (value - min) / (max - min);
    const offset = percentage * (sliderWidth - 20);
    tooltip.style.left = `${offset + 10}px`;

    // Enviar el valor a Particle
    sendValueToParticle(value);
}

// Inicializar el tooltip con la posición correcta al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    const slider = document.getElementById('slider');
    updateValue(slider); // Inicializar con el valor inicial
});