// Firebase initialization will be handled by HTML script tags
// This ensures compatibility across different environments

// Check Firebase connection
function checkFirebaseConnection() {
    if (window.auth && window.db && window.collection && window.query && window.where && window.onSnapshot) {
        console.log('Firebase initialized successfully');
        return true;
    } else {
        console.error('Firebase not properly initialized. Make sure Firebase scripts are loaded.');
        console.log('Available Firebase functions:', {
            auth: !!window.auth,
            db: !!window.db,
            collection: !!window.collection,
            query: !!window.query,
            where: !!window.where,
            onSnapshot: !!window.onSnapshot
        });
        return false;
    }
}

// Initialize Firebase when DOM is ready
function initializeFirebaseApp() {
    // This function should be called after Firebase scripts are loaded
    // The actual initialization will be done in the HTML file
    console.log('Checking Firebase initialization...');
    
    if (typeof firebase !== 'undefined') {
        console.log('Firebase SDK loaded successfully');
        return true;
    } else {
        console.error('Firebase SDK not loaded. Make sure to include Firebase scripts in your HTML.');
        return false;
    }
}

// Crear partículas de fondo
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Cambiar entre pestañas
function switchTab(tab, event) {
    // Remover clase active de todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Agregar clase active al botón clickeado
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Ocultar todas las secciones
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar la sección correspondiente
    const targetSection = document.getElementById(tab + '-form');
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Función para validar que la ubicación sea real
function validateRealLocation(position) {
    if (!position || !position.coords) {
        console.log('❌ No hay coordenadas en la posición');
        return false;
    }
    
    const { latitude, longitude, accuracy, timestamp } = position.coords;
    
    // Validar coordenadas válidas
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        console.log('❌ Coordenadas no son números válidos');
        return false;
    }
    
    // Validar rango de coordenadas (República Dominicana aproximadamente)
    if (latitude < 17.0 || latitude > 20.0 || longitude < -72.0 || longitude > -68.0) {
        console.log('❌ Ubicación fuera de República Dominicana');
        return false;
    }
    
    // Validar precisión (debe ser menor a 100 metros)
    if (accuracy > 100) {
        console.log('❌ Precisión muy baja:', accuracy, 'metros');
        return false;
    }
    
    // Validar timestamp (debe ser reciente, no más de 30 segundos)
    const now = Date.now();
    const positionTime = timestamp || now;
    const timeDiff = Math.abs(now - positionTime);
    
    if (timeDiff > 30000) { // 30 segundos
        console.log('❌ Ubicación muy antigua:', timeDiff, 'ms');
        return false;
    }
    
    // Validar que no sea una ubicación simulada (coordenadas exactas)
    if (latitude === Math.floor(latitude) && longitude === Math.floor(longitude)) {
        console.log('❌ Coordenadas parecen simuladas (números enteros)');
        return false;
    }
    
    // Validar que no sea una ubicación de prueba común
    const commonTestLocations = [
        { lat: 18.4861, lng: -69.9312 }, // Santo Domingo
        { lat: 0, lng: 0 }, // Coordenadas 0,0
        { lat: 37.7749, lng: -122.4194 }, // San Francisco (común en pruebas)
        { lat: 40.7128, lng: -74.0060 } // Nueva York (común en pruebas)
    ];
    
    for (const testLoc of commonTestLocations) {
        const distance = calculateDistance(latitude, longitude, testLoc.lat, testLoc.lng);
        if (distance < 10) { // Menos de 10 metros de distancia
            console.log('❌ Ubicación coincide con ubicación de prueba común');
            return false;
        }
    }
    
    console.log('✅ Ubicación validada como real');
    return true;
}

// Función para calcular distancia entre dos puntos
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distancia en metros
}

// Función para detectar movimiento real del conductor
function detectRealMovement(currentLocation, lastLocation, timeDiff) {
    if (!lastLocation) return true; // Primera ubicación
    
    const distance = calculateDistance(
        currentLocation.lat, currentLocation.lng,
        lastLocation.lat, lastLocation.lng
    );
    
    // Calcular velocidad en km/h
    const speed = (distance / 1000) / (timeDiff / 3600000);
    
    // Validar que la velocidad sea realista para un vehículo
    if (speed > 120) { // Más de 120 km/h es sospechoso
        console.log('⚠️ Velocidad sospechosa:', speed, 'km/h');
        return false;
    }
    
    // Validar que haya movimiento mínimo (al menos 5 metros en 30 segundos)
    if (distance < 5 && timeDiff > 30000) {
        console.log('⚠️ Conductor no se está moviendo');
        return false;
    }
    
    return true;
}

// Función para validar ubicación del usuario también
function validateUserLocation(position) {
    if (!position || !position.coords) {
        return false;
    }
    
    const { latitude, longitude, accuracy } = position.coords;
    
    // Validar coordenadas válidas
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return false;
    }
    
    // Validar rango de coordenadas (República Dominicana)
    if (latitude < 17.0 || latitude > 20.0 || longitude < -72.0 || longitude > -68.0) {
        return false;
    }
    
    // Validar precisión (debe ser menor a 200 metros para usuario)
    if (accuracy > 200) {
        return false;
    }
    
    return true;
}

// Función para sanitizar texto y prevenir XSS
function sanitizeText(text) {
    if (typeof text !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Función para crear elementos HTML de forma segura
function createSafeHTML(template, data) {
    // Reemplazar variables en el template de forma segura
    return template.replace(/\$\{([^}]+)\}/g, (match, key) => {
        const value = data[key];
        return value ? sanitizeText(String(value)) : '';
    });
}

// Mostrar alerta personalizada
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.form-container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Validación de formularios
function validateForm(formId) {
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    if (data.password !== data.confirmPassword) {
        showAlert('Las contraseñas no coinciden', 'error');
        return false;
    }
    
    if (data.password.length < 8) {
        showAlert('La contraseña debe tener al menos 8 caracteres', 'error');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showAlert('Por favor ingresa un correo válido', 'error');
        return false;
    }
    
    return true;
}

// Registrar usuario en Firebase
async function registerUser(userData, userType) {
    try {
        const userCredential = await window.createUserWithEmailAndPassword(
            window.auth, 
            userData.email, 
            userData.password
        );
        
        await window.updateProfile(userCredential.user, {
            displayName: `${userData.firstName} ${userData.lastName}`
        });
        
        await window.setDoc(window.doc(window.db, 'users', userCredential.user.uid), {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phone: userData.phone,
            userType: userType,
            createdAt: new Date(),
            ...(userType === 'driver' && {
                licenseNumber: userData.licenseNumber,
                vehicle: {
                    brand: userData.vehicleBrand,
                    model: userData.vehicleModel,
                    year: userData.vehicleYear,
                    color: userData.vehicleColor,
                    plate: userData.vehiclePlate
                },
                verified: false
            })
        });
        
        return userCredential.user;
    } catch (error) {
        throw error;
    }
}

// Manejar envío de formulario de usuario
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    
    document.getElementById('userRegistrationForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm('userRegistrationForm')) return;
        
        const submitBtn = this.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creando cuenta...';
        submitBtn.disabled = true;
        
        try {
            const formData = new FormData(this);
            const userData = Object.fromEntries(formData.entries());
            
            await registerUser(userData, 'user');
            
            showAlert('¡Cuenta creada exitosamente! Bienvenido a Deyconic Go', 'success');
            this.reset();
            
        } catch (error) {
            let errorMessage = 'Error al crear la cuenta';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este correo ya está registrado';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'La contraseña es muy débil';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Correo electrónico inválido';
                    break;
            }
            
            showAlert(errorMessage, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Manejar login de usuario
    document.getElementById('userLoginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Iniciando sesión...';
        submitBtn.disabled = true;
        
        try {
            const formData = new FormData(this);
            const { email, password } = Object.fromEntries(formData.entries());
            
            const user = await loginUser(email, password);
            
            showAlert('¡Inicio de sesión exitoso!', 'success');
            setTimeout(() => {
                showMainApp(user);
            }, 1500);
            this.reset();
            
        } catch (error) {
            let errorMessage = 'Error al iniciar sesión';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Usuario no encontrado';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Contraseña incorrecta';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Correo electrónico inválido';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Demasiados intentos. Intenta más tarde';
                    break;
            }
            
            showAlert(errorMessage, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Manejar login de conductor
    document.getElementById('driverLoginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Iniciando sesión...';
        submitBtn.disabled = true;
        
        try {
            const formData = new FormData(this);
            const { email, password } = Object.fromEntries(formData.entries());
            
            const user = await loginUser(email, password);
            
            showAlert('¡Bienvenido conductor!', 'success');
            setTimeout(() => {
                showDriverApp(user);
            }, 1500);
            this.reset();
            
        } catch (error) {
            let errorMessage = 'Error al iniciar sesión';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Conductor no encontrado';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Contraseña incorrecta';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Correo electrónico inválido';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Demasiados intentos. Intenta más tarde';
                    break;
            }
            
            showAlert(errorMessage, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Manejar envío de formulario de conductor
    document.getElementById('driverRegistrationForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm('driverRegistrationForm')) return;
        
        const submitBtn = this.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Enviando solicitud...';
        submitBtn.disabled = true;
        
        try {
            const formData = new FormData(this);
            const userData = Object.fromEntries(formData.entries());
            
            await registerUser(userData, 'driver');
            
            showAlert('¡Solicitud enviada! Te contactaremos para verificar tus documentos', 'success');
            this.reset();
            
        } catch (error) {
            let errorMessage = 'Error al enviar la solicitud';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este correo ya está registrado';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'La contraseña es muy débil';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Correo electrónico inválido';
                    break;
            }
            
            showAlert(errorMessage, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});

// Formatear número de teléfono
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 6) {
        value = value.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
    } else if (value.length >= 4) {
        value = value.replace(/(\d{1})(\d{3})(\d+)/, '+$1 ($2) $3');
    }
    input.value = value;
}

// Variables globales para el mapa
let map = null;
let currentLocationMarker = null;
let destinationMarker = null;
let directionsService = null;
let directionsRenderer = null;
let autocompleteDestination = null;

// Variables para tracking en tiempo real
let trackingMap = null;
let driverMarker = null;
let userMarker = null;
let trackingDirectionsRenderer = null;
let locationWatcher = null;
let currentTripId = null;
let currentUserType = 'user';
let liveTrackingMap = null;
let liveDirectionsRenderer = null;
let driverLiveMap = null;
let driverDirectionsRenderer = null;

// Sistema de cleanup para prevenir memory leaks
const cleanupManager = {
    listeners: new Set(),
    watchers: new Set(),
    intervals: new Set(),
    timeouts: new Set(),
    
    addListener: function(listener) {
        this.listeners.add(listener);
        return listener;
    },
    
    addWatcher: function(watcher) {
        this.watchers.add(watcher);
        return watcher;
    },
    
    addInterval: function(interval) {
        this.intervals.add(interval);
        return interval;
    },
    
    addTimeout: function(timeout) {
        this.timeouts.add(timeout);
        return timeout;
    },
    
    cleanup: function() {
        // Limpiar listeners de Firebase
        this.listeners.forEach(listener => {
            if (typeof listener === 'function') {
                listener();
            }
        });
        this.listeners.clear();
        
        // Limpiar watchers de geolocalización
        this.watchers.forEach(watcher => {
            if (watcher && navigator.geolocation) {
                navigator.geolocation.clearWatch(watcher);
            }
        });
        this.watchers.clear();
        
        // Limpiar intervals
        this.intervals.forEach(interval => {
            clearInterval(interval);
        });
        this.intervals.clear();
        
        // Limpiar timeouts
        this.timeouts.forEach(timeout => {
            clearTimeout(timeout);
        });
        this.timeouts.clear();
        
        // Limpiar mapas y marcadores
        this.cleanupMaps();
    },
    
    cleanupMaps: function() {
        // Limpiar marcadores
        [currentLocationMarker, destinationMarker, driverMarker, userMarker].forEach(marker => {
            if (marker) {
                marker.setMap(null);
            }
        });
        
        // Limpiar renderers
        [directionsRenderer, trackingDirectionsRenderer, liveDirectionsRenderer, driverDirectionsRenderer].forEach(renderer => {
            if (renderer) {
                renderer.setMap(null);
            }
        });
        
        // Resetear variables
        currentLocationMarker = null;
        destinationMarker = null;
        driverMarker = null;
        userMarker = null;
        directionsRenderer = null;
        trackingDirectionsRenderer = null;
        liveDirectionsRenderer = null;
        driverDirectionsRenderer = null;
        locationWatcher = null;
        currentTripId = null;
    }
};

// Configuración de tarifas
const FARE_CONFIG = {
    pricePerKm: 30.00,
    platformFee: 0.05 // 5%
};

// Mostrar modal de solicitud de viaje
function requestRide() {
    document.getElementById('rideModal').style.display = 'block';
    setTimeout(() => {
        if (typeof google !== 'undefined') {
            initMap();
        }
    }, 100);
}

// Cerrar modal
function closeRideModal() {
    document.getElementById('rideModal').style.display = 'none';
}

// Inicializar mapa de Google
function initMap() {
    const defaultLocation = { lat: 18.4861, lng: -69.9312 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: defaultLocation,
        styles: [
            { elementType: 'geometry', stylers: [{ color: '#1A1A1A' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#0D0D0D' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#EAEAEA' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2E2E2E' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#3B82F6' }] }
        ]
    });
    
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        draggable: true,
        polylineOptions: { strokeColor: '#22C55E', strokeWeight: 4 }
    });
    directionsRenderer.setMap(map);
    
    autocompleteDestination = new google.maps.places.Autocomplete(
        document.getElementById('destination'),
        { types: ['establishment', 'geocode'] }
    );
    
    autocompleteDestination.addListener('place_changed', () => {
        const place = autocompleteDestination.getPlace();
        if (place.geometry) {
            setDestinationMarker(place.geometry.location, place.name);
            calculateRoute();
        }
    });
    
    getCurrentLocation();
}

// Obtener ubicación actual con manejo mejorado de errores
function getCurrentLocation() {
    const locationInput = document.getElementById('currentLocation');
    if (!locationInput) return;
    
    locationInput.value = 'Obteniendo ubicación...';
    
    if (!navigator.geolocation) {
        locationInput.value = 'Geolocalización no soportada';
        showAlert('Tu navegador no soporta geolocalización', 'error');
        return;
    }
    
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
    };
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            setCurrentLocationMarker(pos);
            
            if (typeof google !== 'undefined' && google.maps) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: pos }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        locationInput.value = results[0].formatted_address;
                    } else {
                        locationInput.value = `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
                    }
                });
            } else {
                locationInput.value = `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
            }
        },
        (error) => {
            let errorMessage = 'Error al obtener ubicación';
            let alertType = 'warning';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Permisos de ubicación denegados. Por favor, habilita la geolocalización en tu navegador.';
                    alertType = 'error';
                    locationInput.value = 'Permisos denegados';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Ubicación no disponible. Verifica tu conexión GPS.';
                    locationInput.value = 'Ubicación no disponible';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Tiempo de espera agotado. Intenta nuevamente.';
                    locationInput.value = 'Tiempo agotado';
                    break;
                default:
                    errorMessage = 'Error desconocido al obtener ubicación.';
                    locationInput.value = 'Error desconocido';
                    break;
            }
            
            showAlert(errorMessage, alertType);
        },
        options
    );
}

// Establecer marcador de ubicación actual
function setCurrentLocationMarker(position) {
    if (currentLocationMarker) {
        currentLocationMarker.setMap(null);
    }
    
    currentLocationMarker = new google.maps.Marker({
        position: position,
        map: map,
        title: 'Tu ubicación',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#EAEAEA',
            strokeWeight: 2
        }
    });
    
    map.setCenter(position);
}

// Establecer marcador de destino
function setDestinationMarker(position, title = 'Destino') {
    if (destinationMarker) {
        destinationMarker.setMap(null);
    }
    
    destinationMarker = new google.maps.Marker({
        position: position,
        map: map,
        title: title,
        icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#EAEAEA',
            strokeWeight: 1
        }
    });
}

// Calcular ruta y tarifa
function calculateRoute() {
    if (currentLocationMarker && destinationMarker) {
        directionsService.route({
            origin: currentLocationMarker.getPosition(),
            destination: destinationMarker.getPosition(),
            travelMode: google.maps.TravelMode.DRIVING
        }, (response, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(response);
                calculateFare(response);
            }
        });
    }
}

// Calcular tarifa basada en distancia
function calculateFare(directionsResult) {
    const route = directionsResult.routes[0];
    const leg = route.legs[0];
    
    // Obtener distancia en kilómetros
    const distanceInMeters = leg.distance.value;
    const distanceInKm = (distanceInMeters / 1000).toFixed(2);
    
    // Calcular tarifas
    const totalFare = parseFloat(distanceInKm) * FARE_CONFIG.pricePerKm;
    const platformCommission = totalFare * FARE_CONFIG.platformFee;
    const driverEarnings = totalFare - platformCommission;
    
    // Mostrar información
    document.getElementById('tripDistance').textContent = `${distanceInKm} km`;
    document.getElementById('totalFare').textContent = `RD$${totalFare.toFixed(2)}`;
    document.getElementById('fareInfo').style.display = 'block';
    
    // Guardar datos para confirmación
    window.currentTrip = {
        distance: distanceInKm,
        totalFare: totalFare,
        platformCommission: platformCommission,
        driverEarnings: driverEarnings,
        duration: leg.duration.text
    };
}

// Mostrar interfaz principal después del login
function showMainApp(user) {
    // Ocultar contenedor de autenticación
    document.getElementById('authContainer').style.display = 'none';
    
    // Mostrar barra de tareas y aplicación principal
    document.getElementById('navbar').style.display = 'block';
    document.getElementById('mainApp').style.display = 'block';
    
    // Personalizar mensajes de bienvenida
    if (user && user.displayName) {
        const firstName = user.displayName.split(' ')[0];
        document.getElementById('welcomeTitle').textContent = `¡Hola ${firstName}!`;
        document.getElementById('welcomeSubtitle').textContent = '¿A dónde quieres ir hoy?';
    }
}

// Cerrar sesión
function logout() {
    if (window.auth && window.auth.currentUser) {
        window.auth.signOut().then(() => {
            // Limpiar recursos antes de cerrar sesión
            cleanupManager.cleanup();
            
            // Mostrar contenedor de autenticación
            document.getElementById('authContainer').style.display = 'flex';
            
            // Ocultar barra de tareas y aplicación principal
            document.getElementById('navbar').style.display = 'none';
            document.getElementById('mainApp').style.display = 'none';
            document.getElementById('driverNavbar').style.display = 'none';
            document.getElementById('driverApp').style.display = 'none';
            
            // Mostrar formulario de usuario por defecto
            document.querySelectorAll('.form-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById('user-form').classList.add('active');
            
            showAlert('Sesión cerrada correctamente', 'success');
        });
    }
}

// Confirmar viaje
function confirmRide() {
    const currentLocation = document.getElementById('currentLocation').value;
    const destination = document.getElementById('destination').value;
    
    if (!currentLocation || currentLocation.includes('Obteniendo')) {
        showAlert('Por favor, obtén tu ubicación actual', 'warning');
        return;
    }
    
    if (!destination) {
        showAlert('Por favor, selecciona un destino', 'warning');
        return;
    }
    
    if (!window.currentTrip) {
        showAlert('Por favor, espera el cálculo de la tarifa', 'warning');
        return;
    }
    
    // Cerrar modal y mostrar estado de búsqueda
    closeRideModal();
    
    // Guardar viaje en Firebase y enviarlo a conductores
    saveTrip(window.currentTrip, currentLocation, destination);
    
    showAlert(`¡Viaje enviado a conductores! Total: RD$${window.currentTrip.totalFare.toFixed(2)}`, 'success');
}

// Guardar viaje en Firebase
async function saveTrip(tripData, origin, destination) {
    try {
        const user = window.auth.currentUser;
        if (!user) {
            console.error('No authenticated user');
            showAlert('Error: Usuario no autenticado', 'error');
            return;
        }
        
        if (!checkFirebaseConnection()) {
            showAlert('Error: Firebase no disponible', 'error');
            return;
        }
        
        const tripId = Date.now().toString();
        const tripDoc = {
            userId: user.uid,
            userName: user.displayName || 'Usuario',
            userPhone: user.phoneNumber || '',
            origin: origin,
            destination: destination,
            distance: tripData.distance,
            totalFare: tripData.totalFare,
            platformCommission: tripData.platformCommission,
            driverEarnings: tripData.driverEarnings,
            duration: tripData.duration,
            status: 'searching', // searching -> accepted -> in_progress -> completed
            createdAt: new Date(),
            timestamp: Date.now()
        };
        
        console.log('Saving trip with data:', tripDoc);
        
        await window.setDoc(window.doc(window.db, 'trips', tripId), tripDoc);
        
        console.log('Viaje guardado con ID:', tripId);
        console.log('Enviando a conductores conectados...');
        
        // Mostrar estado de búsqueda inmediatamente
        showSearchingDriver(tripId);
        
    } catch (error) {
        console.error('Error saving trip:', error);
        showAlert('Error al enviar el viaje: ' + error.message, 'error');
    }
}

// Mostrar estado de búsqueda de conductor
function showSearchingDriver(tripId) {
    const mainApp = document.getElementById('mainApp');
    const appContent = mainApp.querySelector('.app-content');
    
    appContent.innerHTML = `
        <div class="searching-section">
            <div class="searching-animation">
                <div class="pulse-circle"></div>
                <div class="car-icon">🚗</div>
            </div>
            <h2>Buscando conductor...</h2>
            <p>Te conectaremos con un conductor cercano</p>
            <button class="cancel-trip-btn" onclick="cancelTrip('${tripId}')">Cancelar Viaje</button>
        </div>
    `;
    
    // Escuchar cambios en el estado del viaje
    const tripRef = window.doc(window.db, 'trips', tripId);
    window.onSnapshot(tripRef, (doc) => {
        if (doc.exists()) {
            const trip = doc.data();
            if (trip.status === 'accepted') {
                showTripAccepted(trip);
            } else if (trip.status === 'completed') {
                showTripCompleted(trip);
            }
        }
    });
}

// Mostrar viaje aceptado
function showTripAccepted(trip) {
    const mainApp = document.getElementById('mainApp');
    const appContent = mainApp.querySelector('.app-content');
    
    appContent.innerHTML = `
        <div class="trip-tracking-container">
            <div id="liveTrackingMap" class="live-tracking-map"></div>
            
            <div class="trip-details-card">
                <div class="card-header">
                    <div class="driver-avatar">
                        <span class="avatar-text">${trip.driverName.charAt(0)}</span>
                    </div>
                    <div class="driver-info">
                        <h3>${trip.driverName}</h3>
                        <p class="vehicle-info">🚗 ${trip.vehicleInfo || 'Vehículo'}</p>
                        <p class="plate-info">📋 ${trip.vehiclePlate || 'ABC-123'}</p>
                    </div>
                    <div class="trip-status-indicator">
                        <div class="status-dot active"></div>
                        <span class="status-text">En camino</span>
                    </div>
                </div>
                
                <div class="progress-timeline">
                    <div class="timeline-step completed">
                        <div class="step-dot">✓</div>
                        <span>Viaje confirmado</span>
                    </div>
                    <div class="timeline-step active" id="drivingStep">
                        <div class="step-dot">🚗</div>
                        <span>Conductor en camino</span>
                    </div>
                    <div class="timeline-step" id="arrivalStep">
                        <div class="step-dot">📍</div>
                        <span>Llegada</span>
                    </div>
                    <div class="timeline-step">
                        <div class="step-dot">🏁</div>
                        <span>Completado</span>
                    </div>
                </div>
                
                <div id="arrivalMessage" class="arrival-message" style="display: none;">
                    <div class="message-content">
                        <div class="message-icon">📍</div>
                        <div class="message-text"></div>
                    </div>
                </div>
                
                <div class="eta-info">
                    <div class="eta-display" id="etaDisplay">Calculando tiempo...</div>
                    <div class="distance-display" id="distanceDisplay"></div>
                    <div class="tracking-status" id="trackingStatus">
                        <span class="status-indicator">🔄</span>
                        <span class="status-text">Rastreando conductor...</span>
                    </div>
                </div>
                
                <div class="trip-actions">
                    <button class="contact-btn" onclick="contactDriver('${trip.driverPhone || ''}')">
                        📞 Contactar
                    </button>
                    <button class="cancel-btn" onclick="cancelTrip('${trip.tripId || 'current'}')">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Inicializar mapa y tracking del usuario
    setTimeout(() => {
        initLiveTrackingMap(trip.tripId || 'current', trip);
        startUserLocationTracking(trip.tripId || 'current');
        
        // Escuchar cambios en el estado del viaje para detectar llegada
        listenForDriverArrival(trip.tripId || 'current');
        
        // Iniciar tracking de ubicación del conductor en tiempo real
        startDriverLocationListener(trip.tripId || 'current', trip);
    }, 100);
}

// Iniciar tracking de ubicación del usuario
function startUserLocationTracking(tripId) {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Actualizar ubicación del usuario en Firebase
                window.updateDoc(window.doc(window.db, 'trips', tripId), {
                    userLocation: userLocation,
                    userLastUpdate: new Date()
                }).catch(error => console.error('Error updating user location:', error));
            },
            (error) => console.error('Error getting user location:', error),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
        );
    }
}

// Iniciar listener de ubicación del conductor para el usuario
function startDriverLocationListener(tripId, tripData) {
    const tripRef = window.doc(window.db, 'trips', tripId);
    
    const driverLocationListener = window.onSnapshot(tripRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            
            // Si hay ubicación del conductor, actualizar el mapa
            if (data.driverLocation && data.status === 'accepted') {
                updateLiveDriverLocation(data.driverLocation, tripData);
            }
            
            // Si el conductor ha llegado
            if (data.status === 'driver_arrived' && data.driverArrivedMessage) {
                // Completar icono de llegada
                const arrivalStep = document.getElementById('arrivalStep');
                const drivingStep = document.getElementById('drivingStep');
                
                if (arrivalStep && drivingStep) {
                    drivingStep.classList.remove('active');
                    drivingStep.classList.add('completed');
                    arrivalStep.classList.add('completed');
                    arrivalStep.innerHTML = `
                        <div class="step-dot completed">✓</div>
                        <span>Llegada</span>
                    `;
                }
                
                // Mostrar mensaje de llegada
                const arrivalMessage = document.getElementById('arrivalMessage');
                if (arrivalMessage) {
                    arrivalMessage.style.display = 'block';
                    arrivalMessage.querySelector('.message-text').textContent = data.driverArrivedMessage;
                }
                
                // Mostrar alerta
                showAlert(data.driverArrivedMessage, 'success');
            }
        }
    });
    
    // Agregar al cleanup manager
    cleanupManager.addListener(driverLocationListener);
}

// Escuchar llegada del conductor
function listenForDriverArrival(tripId) {
    const tripRef = window.doc(window.db, 'trips', tripId);
    
    window.onSnapshot(tripRef, (doc) => {
        if (doc.exists()) {
            const tripData = doc.data();
            
            // Verificar si el conductor ha llegado
            if (tripData.status === 'driver_arrived' && tripData.driverArrivedMessage) {
                // Completar icono de llegada
                const arrivalStep = document.getElementById('arrivalStep');
                const drivingStep = document.getElementById('drivingStep');
                
                if (arrivalStep && drivingStep) {
                    drivingStep.classList.remove('active');
                    drivingStep.classList.add('completed');
                    arrivalStep.classList.add('completed');
                    arrivalStep.innerHTML = `
                        <div class="step-dot completed">✓</div>
                        <span>Llegada</span>
                    `;
                }
                
                // Mostrar mensaje de llegada
                const arrivalMessage = document.getElementById('arrivalMessage');
                if (arrivalMessage) {
                    arrivalMessage.style.display = 'block';
                    arrivalMessage.querySelector('.message-text').textContent = tripData.driverArrivedMessage;
                }
                
                // Mostrar alerta
                showAlert(tripData.driverArrivedMessage, 'success');
            }
        }
    });
}

// Mostrar viaje completado
function showTripCompleted(trip) {
    const mainApp = document.getElementById('mainApp');
    const appContent = mainApp.querySelector('.app-content');
    
    appContent.innerHTML = `
        <div class="trip-completed-section">
            <div class="completion-message">
                <h2>🎉 Viaje completado</h2>
                <p>¡Gracias por usar Blinriderd!</p>
                <div class="trip-summary">
                    <p><strong>Total pagado:</strong> RD$${trip.totalFare.toFixed(2)}</p>
                    <p><strong>Distancia:</strong> ${trip.distance} km</p>
                </div>
            </div>
            <button class="home-btn" onclick="showSection('home')">Volver al inicio</button>
        </div>
    `;
    
    setTimeout(() => {
        showSection('home');
    }, 5000);
}

// Cancelar viaje
async function cancelTrip(tripId) {
    try {
        await window.updateDoc(window.doc(window.db, 'trips', tripId), {
            status: 'cancelled',
            cancelledAt: new Date()
        });
        
        showAlert('Viaje cancelado', 'warning');
        showSection('home');
    } catch (error) {
        console.error('Error cancelling trip:', error);
        showAlert('Error al cancelar el viaje', 'error');
    }
}

// Cargar viajes del usuario
async function loadUserTrips() {
    try {
        const user = window.auth.currentUser;
        if (!user) return;
        
        const activityList = document.getElementById('activityList');
        activityList.innerHTML = '<p>Cargando viajes...</p>';
        
        // Consulta real de Firebase para obtener viajes del usuario
        const userTripsQuery = window.query(
            window.collection(window.db, 'trips'),
            window.where('userId', '==', user.uid)
        );
        
        window.onSnapshot(userTripsQuery, (snapshot) => {
            if (snapshot.empty) {
                activityList.innerHTML = '<p>No hay viajes registrados</p>';
                return;
            }
            
            let tripsHTML = '';
            const trips = [];
            
            snapshot.forEach((doc) => {
                trips.push({ id: doc.id, ...doc.data() });
            });
            
            // Ordenar por fecha más reciente
            trips.sort((a, b) => b.timestamp - a.timestamp);
            
            trips.forEach((trip) => {
                const statusText = {
                    'searching': 'Buscando conductor',
                    'accepted': 'Conductor asignado',
                    'in_progress': 'En progreso',
                    'completed': 'Completado',
                    'cancelled': 'Cancelado'
                };
                
                const statusClass = {
                    'searching': 'status-searching',
                    'accepted': 'status-accepted',
                    'in_progress': 'status-progress',
                    'completed': 'status-completed',
                    'cancelled': 'status-cancelled'
                };
                
                // Crear HTML de forma segura
                const tripHTML = createSafeHTML(`
                    <div class="trip-history-card">
                        <div class="trip-header">
                            <span class="trip-date">\${tripDate}</span>
                            <span class="trip-status \${statusClass}">\${statusText}</span>
                        </div>
                        <div class="trip-route">
                            <div class="route-point">📍 \${origin}</div>
                            <div class="route-arrow">→</div>
                            <div class="route-point">📍 \${destination}</div>
                        </div>
                        <div class="trip-details">
                            <span class="trip-distance">\${distance} km</span>
                            <span class="trip-fare">RD$\${totalFare}</span>
                            \${driverInfo}
                        </div>
                    </div>
                `, {
                    tripDate: formatTripDate(trip.createdAt.toDate()),
                    statusClass: statusClass[trip.status],
                    statusText: statusText[trip.status],
                    origin: trip.origin,
                    destination: trip.destination,
                    distance: trip.distance,
                    totalFare: trip.totalFare.toFixed(2),
                    driverInfo: trip.driverName ? `<span class="trip-driver">👤 ${sanitizeText(trip.driverName)}</span>` : ''
                });
                
                tripsHTML += tripHTML;
            });
            
            activityList.innerHTML = tripsHTML;
        });
        
    } catch (error) {
        console.error('Error loading trips:', error);
        document.getElementById('activityList').innerHTML = '<p>Error cargando viajes</p>';
    }
}

// Formatear fecha del viaje
function formatTripDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Ayer';
    } else if (diffDays < 7) {
        return `Hace ${diffDays} días`;
    } else {
        return date.toLocaleDateString('es-ES');
    }
}

// Mostrar interfaz del conductor
function showDriverApp(user) {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('navbar').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    
    document.getElementById('driverNavbar').style.display = 'block';
    document.getElementById('driverApp').style.display = 'block';
    
    if (user && user.displayName) {
        const firstName = user.displayName.split(' ')[0];
        document.querySelector('#driverApp .welcome-section h1').textContent = `¡Hola ${firstName}!`;
    }
}

// Alternar estado del conductor
let driverOnline = false;
function toggleDriverStatus() {
    if (!checkFirebaseConnection()) {
        showAlert('Error: Firebase no disponible', 'error');
        return;
    }
    
    driverOnline = !driverOnline;
    const statusElement = document.getElementById('driverStatus');
    const statusBtn = document.getElementById('statusBtn');
    const driverContent = document.getElementById('driverContent');
    
    if (driverOnline) {
        statusElement.className = 'status-indicator online';
        statusElement.querySelector('.status-text').textContent = 'Conectado';
        statusBtn.textContent = 'Desconectarse';
        statusBtn.className = 'toggle-status-btn offline';
        
        driverContent.innerHTML = `
            <div id="availableTrips" class="trips-container">
                <h3>📍 Viajes Disponibles</h3>
                <div class="trips-list" id="tripsList">
                    <p>Buscando viajes cercanos...</p>
                </div>
            </div>
        `;
        
        // Esperar un poco para que el DOM se actualice
        setTimeout(() => {
            loadAvailableTrips();
        }, 100);
    } else {
        // Detener listener si está activo
        if (tripsListener) {
            tripsListener();
            tripsListener = null;
        }
        
        statusElement.className = 'status-indicator offline';
        statusElement.querySelector('.status-text').textContent = 'Desconectado';
        statusBtn.textContent = 'Conectarse';
        statusBtn.className = 'toggle-status-btn online';
        
        driverContent.innerHTML = `
            <div class="no-trips">
                <h2>🚕 Esperando viajes...</h2>
                <p>Conéctate para recibir solicitudes</p>
            </div>
        `;
    }
}

// Cargar viajes disponibles desde Firebase
let tripsListener = null;
function loadAvailableTrips() {
    const tripsList = document.getElementById('tripsList');
    if (!tripsList) {
        console.error('Element tripsList not found');
        return;
    }
    
    if (!checkFirebaseConnection()) {
        tripsList.innerHTML = '<p>Error: Firebase no disponible</p>';
        return;
    }
    
    tripsList.innerHTML = '<p>Buscando viajes cercanos...</p>';
    
    try {
        // Consulta en tiempo real de viajes con estado "searching"
        const tripsRef = window.collection(window.db, 'trips');
        const searchingTrips = window.query(tripsRef, window.where('status', '==', 'searching'));
        
        console.log('Setting up trips listener...');
        
        // Escuchar cambios en tiempo real
        tripsListener = window.onSnapshot(searchingTrips, 
            (snapshot) => {
                console.log(`Snapshot received: ${snapshot.size} trips`);
                console.log('Snapshot empty:', snapshot.empty);
                
                if (snapshot.empty) {
                    tripsList.innerHTML = '<p>No hay viajes disponibles</p>';
                    return;
                }
                
                let tripsHTML = '';
                snapshot.forEach((doc) => {
                    const trip = doc.data();
                    const tripId = doc.id;
                    
                    console.log('Trip data:', tripId, trip);
                    
                    // Validar que el viaje tenga los campos necesarios
                    if (!trip.origin || !trip.destination || !trip.totalFare) {
                        console.warn('Trip missing required fields:', tripId, trip);
                        return;
                    }
                    
                    // Calcular ganancias del conductor (95%)
                    const driverEarnings = (trip.totalFare * 0.95).toFixed(2);
                    
                    // Crear HTML de forma segura
                    const tripCardHTML = createSafeHTML(`
                        <div class="trip-card" data-trip-id="\${tripId}">
                            <div class="trip-info">
                                <div class="trip-route">
                                    <div class="route-point">📍 \${origin}</div>
                                    <div class="route-arrow">→</div>
                                    <div class="route-point">📍 \${destination}</div>
                                </div>
                                <div class="trip-details">
                                    <span class="distance">\${distance} km</span>
                                    <span class="fare">RD$\${totalFare}</span>
                                    <span class="earnings">Ganas: RD$\${driverEarnings}</span>
                                </div>
                                <div class="trip-user">
                                    <span class="user-name">👤 \${userName}</span>
                                    <span class="trip-time">\${tripTime}</span>
                                </div>
                            </div>
                            <div class="trip-actions">
                                <button class="accept-btn" onclick="acceptTrip('\${tripId}')">Aceptar</button>
                                <button class="decline-btn" onclick="declineTrip('\${tripId}')">Rechazar</button>
                            </div>
                        </div>
                    `, {
                        tripId: tripId,
                        origin: trip.origin,
                        destination: trip.destination,
                        distance: trip.distance || 'N/A',
                        totalFare: trip.totalFare.toFixed(2),
                        driverEarnings: driverEarnings,
                        userName: trip.userName || 'Usuario',
                        tripTime: trip.createdAt ? formatTime(trip.createdAt.toDate()) : 'Ahora'
                    });
                    
                    tripsHTML += tripCardHTML;
                });
                
                tripsList.innerHTML = tripsHTML;
            },
            (error) => {
                console.error('Firestore listener error:', error);
                tripsList.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        );
        
        // Agregar al cleanup manager
        if (tripsListener) {
            cleanupManager.addListener(tripsListener);
        }
        
    } catch (error) {
        console.error('Setup error:', error);
        tripsList.innerHTML = '<p>Error en configuración</p>';
    }
}



// Formatear tiempo
function formatTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    return `${Math.floor(diffMins / 60)}h`;
}

// Aceptar viaje
async function acceptTrip(tripId) {
    try {
        const currentUser = window.auth.currentUser;
        if (!currentUser) return;
        
        // Obtener datos del viaje
        const tripDoc = await window.getDoc(window.doc(window.db, 'trips', tripId));
        if (!tripDoc.exists()) {
            showAlert('Error: Viaje no encontrado', 'error');
            return;
        }
        
        const tripData = tripDoc.data();
        
        // Obtener ubicación actual del conductor con validación
        let driverLocation = null;
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 0 // No usar ubicación en caché
                    });
                });
                
                // Validar que la ubicación sea real
                if (validateRealLocation(position)) {
                    driverLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp,
                        altitude: position.coords.altitude,
                        heading: position.coords.heading,
                        speed: position.coords.speed
                    };
                    console.log('Driver location validated:', driverLocation);
                } else {
                    throw new Error('Ubicación no válida o simulada');
                }
            } catch (error) {
                console.error('Error getting driver location:', error);
                showAlert('No se pudo obtener una ubicación válida. Verifica que la geolocalización esté habilitada.', 'error');
                return;
            }
        } else {
            showAlert('Tu navegador no soporta geolocalización', 'error');
            return;
        }
        
        // Actualizar estado del viaje en Firebase
        await window.updateDoc(window.doc(window.db, 'trips', tripId), {
            status: 'accepted',
            driverId: currentUser.uid,
            driverName: currentUser.displayName || 'Conductor',
            acceptedAt: new Date(),
            driverLocation: driverLocation,
            lastLocationUpdate: new Date()
        });
        
        showAlert('Viaje aceptado! Dirigiéndote al cliente...', 'success');
        
        // Detener listener de viajes disponibles
        if (tripsListener) {
            tripsListener();
            tripsListener = null;
        }
        
        // Mostrar interfaz de viaje activo con navegación
        showActiveTrip(tripId, tripData);
        
    } catch (error) {
        console.error('Error accepting trip:', error);
        showAlert('Error al aceptar el viaje', 'error');
    }
}

// Mostrar viaje activo con navegación
function showActiveTrip(tripId, tripData) {
    const driverContent = document.getElementById('driverContent');
    
    driverContent.innerHTML = `
        <div class="driver-trip-container">
            <div id="driverLiveMap" class="driver-live-map"></div>
            
            <div class="driver-trip-card">
                <div class="client-header">
                    <div class="client-avatar">
                        <span class="client-initial">${tripData.userName.charAt(0)}</span>
                    </div>
                    <div class="client-info">
                        <h3>${tripData.userName}</h3>
                        <p class="client-phone">📞 ${tripData.userPhone || 'No disponible'}</p>
                    </div>
                    <div class="trip-earnings">
                        <div class="earnings-amount">RD$${(tripData.totalFare * 0.95).toFixed(2)}</div>
                        <div class="earnings-label">Ganarás</div>
                    </div>
                </div>
                
                <div class="route-info">
                    <div class="route-item pickup">
                        <div class="route-icon">📍</div>
                        <div class="route-text">
                            <span class="route-label">Recoger en:</span>
                            <span class="route-address">${tripData.origin}</span>
                        </div>
                    </div>
                    <div class="route-item destination">
                        <div class="route-icon">🏁</div>
                        <div class="route-text">
                            <span class="route-label">Destino:</span>
                            <span class="route-address">${tripData.destination}</span>
                        </div>
                    </div>
                </div>
                
                <div class="driver-progress">
                    <div class="progress-step completed">
                        <div class="step-dot">✓</div>
                        <span>Aceptado</span>
                    </div>
                    <div class="progress-step active" id="currentStep">
                        <div class="step-dot">🚗</div>
                        <span>En camino</span>
                    </div>
                    <div class="progress-step" id="arrivedStep">
                        <div class="step-dot">📍</div>
                        <span>Llegada</span>
                    </div>
                    <div class="progress-step" id="completedStep">
                        <div class="step-dot">🏁</div>
                        <span>Completado</span>
                    </div>
                </div>
                
                <div class="trip-eta">
                    <div class="eta-item">
                        <span id="driverEtaDisplay">Calculando...</span>
                    </div>
                    <div class="eta-item">
                        <span id="driverDistanceDisplay">${tripData.distance} km</span>
                    </div>
                </div>
                
                <div class="driver-actions">
                    <button class="action-btn primary" id="arrivedBtn" onclick="markDriverArrived('${tripId}')">
                        ✅ He llegado
                    </button>
                    <button class="action-btn secondary" id="startTripBtn" onclick="startTrip('${tripId}')" style="display: none;">
                        🚀 Iniciar viaje
                    </button>
                    <button class="action-btn success" id="completeTripBtn" onclick="completeTrip('${tripId}')" style="display: none;">
                        🏁 Finalizar viaje
                    </button>
                    <button class="action-btn danger" onclick="cancelActiveTrip('${tripId}')">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Inicializar mapa del conductor
    setTimeout(() => {
        initDriverLiveMap(tripId, tripData);
        // Iniciar tracking inmediatamente
        startDriverLocationUpdates(tripId, tripData);
    }, 100);
}

// Abrir en Waze
function openInWaze(destination) {
    const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`;
    window.open(wazeUrl, '_blank');
}

// Marcar llegada al punto de recogida
async function markArrived(tripId) {
    try {
        await window.updateDoc(window.doc(window.db, 'trips', tripId), {
            status: 'driver_arrived',
            arrivedAt: new Date()
        });
        
        showAlert('✅ Marcado como llegado. El cliente ha sido notificado.', 'success');
        
        // Actualizar el estado visual
        const statusSteps = document.querySelectorAll('.status-step');
        if (statusSteps.length >= 2) {
            statusSteps[1].classList.remove('current');
            statusSteps[1].classList.add('active');
            statusSteps[1].innerHTML = `
                <span class="step-icon">✓</span>
                <span>Llegaste al punto de recogida</span>
            `;
        }
        
        // Ocultar botón "He llegado"
        const arrivedBtn = document.querySelector('.arrived-btn');
        if (arrivedBtn) {
            arrivedBtn.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error marking arrival:', error);
        showAlert('Error al marcar llegada', 'error');
    }
}

// Cancelar viaje activo
async function cancelActiveTrip(tripId) {
    if (confirm('¿Estás seguro de que quieres cancelar este viaje?')) {
        try {
            await window.updateDoc(window.doc(window.db, 'trips', tripId), {
                status: 'cancelled_by_driver',
                cancelledAt: new Date()
            });
            
            showAlert('Viaje cancelado', 'warning');
            
            // Volver a la lista de viajes disponibles
            const driverContent = document.getElementById('driverContent');
            driverContent.innerHTML = `
                <div id="availableTrips" class="trips-container">
                    <h3>📍 Viajes Disponibles</h3>
                    <div class="trips-list" id="tripsList">
                        <p>Buscando viajes cercanos...</p>
                    </div>
                </div>
            `;
            loadAvailableTrips();
            
        } catch (error) {
            console.error('Error cancelling trip:', error);
            showAlert('Error al cancelar el viaje', 'error');
        }
    }
}

// Rechazar viaje
function declineTrip(tripId) {
    showAlert('Viaje rechazado', 'warning');
    loadAvailableTrips();
}

// Completar viaje
async function completeTrip(tripId) {
    try {
        // Actualizar estado del viaje en Firebase
        await window.updateDoc(window.doc(window.db, 'trips', tripId), {
            status: 'completed',
            completedAt: new Date()
        });
        
        showAlert('Viaje completado! Ganancias agregadas', 'success');
        
        setTimeout(() => {
            const driverContent = document.getElementById('driverContent');
            driverContent.innerHTML = `
                <div id="availableTrips" class="trips-container">
                    <h3>📍 Viajes Disponibles</h3>
                    <div class="trips-list" id="tripsList">
                        <p>Buscando viajes cercanos...</p>
                    </div>
                </div>
            `;
            loadAvailableTrips();
        }, 2000);
        
    } catch (error) {
        console.error('Error completing trip:', error);
        showAlert('Error al completar el viaje', 'error');
    }
}

// Navegación del conductor
function showDriverSection(section, event) {
    document.querySelectorAll('#driverNavbar .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Agregar clase active al elemento clickeado si existe el evento
    if (event && event.target) {
        const navItem = event.target.closest('.nav-item');
        if (navItem) {
            navItem.classList.add('active');
        }
    }
    
    const driverContent = document.getElementById('driverContent');
    
    switch(section) {
        case 'trips':
            if (driverOnline) {
                driverContent.innerHTML = `
                    <div id="availableTrips" class="trips-container">
                        <h3>📍 Viajes Disponibles</h3>
                        <div class="trips-list" id="tripsList">
                            <p>Buscando viajes cercanos...</p>
                        </div>
                    </div>
                `;
                setTimeout(() => loadAvailableTrips(), 100);
            } else {
                driverContent.innerHTML = `
                    <div class="no-trips">
                        <h2>🚕 Esperando viajes...</h2>
                        <p>Conéctate para recibir solicitudes</p>
                    </div>
                `;
            }
            break;
        case 'earnings':
            loadDriverEarnings();
            break;
        case 'profile':
            loadDriverProfile();
            break;
    }
}

// Aplicar formato a números de teléfono
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que Firebase se inicialice
    setTimeout(() => {
        console.log('Checking Firebase initialization after DOM load...');
        checkFirebaseConnection();
    }, 1000);
    
    document.getElementById('userPhone').addEventListener('input', function() {
        formatPhoneNumber(this);
    });
    
    document.getElementById('driverPhone').addEventListener('input', function() {
        formatPhoneNumber(this);
    });
    
    window.onclick = function(event) {
        const modal = document.getElementById('rideModal');
        if (event.target === modal) {
            closeRideModal();
        }
    };
    
    // Cleanup automático al cerrar la página
    window.addEventListener('beforeunload', function() {
        cleanupManager.cleanup();
    });
    
    // Cleanup cuando se cambia de página (SPA)
    window.addEventListener('pagehide', function() {
        cleanupManager.cleanup();
    });
});

// Mostrar formulario de login
function showLogin(userType) {
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(userType + '-login').classList.add('active');
}

// Mostrar formulario de registro
function showRegister(userType) {
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(userType + '-form').classList.add('active');
}

// Mostrar sección de conductor
function showDriverSection() {
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('driver-form').classList.add('active');
}

// Mostrar sección de navegación
function showSection(section, event) {
    // Actualizar botones activos
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Agregar clase active al elemento clickeado si existe el evento
    if (event && event.target) {
        const navItem = event.target.closest('.nav-item');
        if (navItem) {
            navItem.classList.add('active');
        }
    }
    
    // Mostrar contenido según la sección
    const mainApp = document.getElementById('mainApp');
    const appContent = mainApp.querySelector('.app-content');
    
    switch(section) {
        case 'home':
            appContent.innerHTML = `
                <div class="welcome-section">
                    <h1 id="welcomeTitle">¡Bienvenido!</h1>
                    <p id="welcomeSubtitle">Tu viaje comienza aquí</p>
                </div>
                <button class="main-ride-btn" onclick="requestRide()">
                    🚗 Pedir un Taxi
                </button>
            `;
            break;
        case 'profile':
            const currentUser = window.auth?.currentUser;
            const userName = currentUser?.displayName || 'Usuario';
            appContent.innerHTML = `
                <div class="profile-section">
                    <h1>👤 Mi Perfil</h1>
                    <div class="profile-info">
                        <p><strong>Nombre:</strong> ${userName}</p>
                    </div>
                </div>
            `;
            break;
        case 'activity':
            appContent.innerHTML = `
                <div class="activity-section">
                    <h1>📈 Actividad</h1>
                    <p>Historial de viajes</p>
                    <div id="activityList" class="activity-list">
                        <p>Cargando viajes...</p>
                    </div>
                </div>
            `;
            loadUserTrips();
            break;
    }
}

// Cargar perfil del conductor
async function loadDriverProfile() {
    const driverContent = document.getElementById('driverContent');
    const currentUser = window.auth?.currentUser;
    
    if (!currentUser) {
        driverContent.innerHTML = '<p>Error: Usuario no autenticado</p>';
        return;
    }
    
    try {
        // Obtener datos del conductor desde Firestore
        const userDoc = await window.getDoc(window.doc(window.db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const userName = currentUser.displayName || `${userData.firstName} ${userData.lastName}`;
            const userEmail = currentUser.email;
            const userPhone = userData.phone || 'No registrado';
            
            driverContent.innerHTML = `
                <div class="profile-section">
                    <h2>👤 Mi Perfil</h2>
                    <div class="profile-card">
                        <div class="profile-avatar">
                            <div class="avatar-circle">
                                <span class="avatar-text">${userName.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="profile-info">
                            <div class="info-item">
                                <span class="info-label">Nombre completo:</span>
                                <span class="info-value">${userName}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Correo electrónico:</span>
                                <span class="info-value">${userEmail}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Teléfono:</span>
                                <span class="info-value">${userPhone}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Estado:</span>
                                <span class="info-value status-${driverOnline ? 'online' : 'offline'}">
                                    ${driverOnline ? '🟢 Conectado' : '🔴 Desconectado'}
                                </span>
                            </div>
                            ${userData.vehicle ? `
                                <div class="vehicle-info">
                                    <h3>🚗 Información del Vehículo</h3>
                                    <div class="info-item">
                                        <span class="info-label">Vehículo:</span>
                                        <span class="info-value">${userData.vehicle.brand} ${userData.vehicle.model} ${userData.vehicle.year}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Color:</span>
                                        <span class="info-value">${userData.vehicle.color}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Placa:</span>
                                        <span class="info-value">${userData.vehicle.plate}</span>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Si no hay datos en Firestore, mostrar datos básicos
            const userName = currentUser.displayName || 'Conductor';
            const userEmail = currentUser.email;
            
            driverContent.innerHTML = `
                <div class="profile-section">
                    <h2>👤 Mi Perfil</h2>
                    <div class="profile-card">
                        <div class="profile-avatar">
                            <div class="avatar-circle">
                                <span class="avatar-text">${userName.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="profile-info">
                            <div class="info-item">
                                <span class="info-label">Nombre:</span>
                                <span class="info-value">${userName}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Correo:</span>
                                <span class="info-value">${userEmail}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Estado:</span>
                                <span class="info-value status-${driverOnline ? 'online' : 'offline'}">
                                    ${driverOnline ? '🟢 Conectado' : '🔴 Desconectado'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading driver profile:', error);
        const userName = currentUser.displayName || 'Conductor';
        
        driverContent.innerHTML = `
            <div class="profile-section">
                <h2>👤 Mi Perfil</h2>
                <div class="profile-card">
                    <div class="profile-info">
                        <div class="info-item">
                            <span class="info-label">Nombre:</span>
                            <span class="info-value">${userName}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Estado:</span>
                            <span class="info-value status-${driverOnline ? 'online' : 'offline'}">
                                ${driverOnline ? '🟢 Conectado' : '🔴 Desconectado'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Cargar ganancias del conductor
async function loadDriverEarnings() {
    const driverContent = document.getElementById('driverContent');
    const currentUser = window.auth?.currentUser;
    
    if (!currentUser) {
        driverContent.innerHTML = '<p>Error: Usuario no autenticado</p>';
        return;
    }
    
    driverContent.innerHTML = `
        <div class="earnings-section">
            <h2>💰 Mis Ganancias</h2>
            <div class="earnings-summary">
                <div class="earning-card">
                    <div class="earning-amount">RD$0.00</div>
                    <div class="earning-label">Hoy</div>
                    <div class="earning-trips">0 viajes</div>
                </div>
                <div class="earning-card">
                    <div class="earning-amount">RD$0.00</div>
                    <div class="earning-label">Esta semana</div>
                    <div class="earning-trips">0 viajes</div>
                </div>
                <div class="earning-card">
                    <div class="earning-amount">RD$0.00</div>
                    <div class="earning-label">Este mes</div>
                    <div class="earning-trips">0 viajes</div>
                </div>
            </div>
            <div class="earnings-details">
                <h3>📈 Historial de Ganancias</h3>
                <div id="earningsHistory" class="earnings-history">
                    <p>Cargando historial...</p>
                </div>
            </div>
        </div>
    `;
    
    // Cargar historial de ganancias
    try {
        const completedTripsQuery = window.query(
            window.collection(window.db, 'trips'),
            window.where('driverId', '==', currentUser.uid),
            window.where('status', '==', 'completed')
        );
        
        window.onSnapshot(completedTripsQuery, (snapshot) => {
            const earningsHistory = document.getElementById('earningsHistory');
            
            if (snapshot.empty) {
                earningsHistory.innerHTML = '<p>Aún no has completado viajes</p>';
                return;
            }
            
            let totalEarnings = 0;
            let todayEarnings = 0;
            let weekEarnings = 0;
            let monthEarnings = 0;
            let todayTrips = 0;
            let weekTrips = 0;
            let monthTrips = 0;
            
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const startOfWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            
            let historyHTML = '';
            const trips = [];
            
            snapshot.forEach((doc) => {
                const trip = doc.data();
                trips.push({ id: doc.id, ...trip });
                
                const driverEarning = trip.totalFare * 0.95; // 95% para el conductor
                totalEarnings += driverEarning;
                
                const tripDate = trip.completedAt.toDate();
                
                if (tripDate >= startOfDay) {
                    todayEarnings += driverEarning;
                    todayTrips++;
                }
                if (tripDate >= startOfWeek) {
                    weekEarnings += driverEarning;
                    weekTrips++;
                }
                if (tripDate >= startOfMonth) {
                    monthEarnings += driverEarning;
                    monthTrips++;
                }
            });
            
            // Actualizar tarjetas de resumen
            const earningCards = document.querySelectorAll('.earning-card');
            if (earningCards.length >= 3) {
                earningCards[0].innerHTML = `
                    <div class="earning-amount">RD$${todayEarnings.toFixed(2)}</div>
                    <div class="earning-label">Hoy</div>
                    <div class="earning-trips">${todayTrips} viajes</div>
                `;
                earningCards[1].innerHTML = `
                    <div class="earning-amount">RD$${weekEarnings.toFixed(2)}</div>
                    <div class="earning-label">Esta semana</div>
                    <div class="earning-trips">${weekTrips} viajes</div>
                `;
                earningCards[2].innerHTML = `
                    <div class="earning-amount">RD$${monthEarnings.toFixed(2)}</div>
                    <div class="earning-label">Este mes</div>
                    <div class="earning-trips">${monthTrips} viajes</div>
                `;
            }
            
            // Mostrar historial (últimos 10 viajes)
            trips.sort((a, b) => b.completedAt.toDate() - a.completedAt.toDate());
            trips.slice(0, 10).forEach((trip) => {
                const driverEarning = (trip.totalFare * 0.95).toFixed(2);
                const tripDate = trip.completedAt.toDate().toLocaleDateString('es-ES');
                
                historyHTML += `
                    <div class="earning-item">
                        <div class="earning-trip-info">
                            <div class="trip-route-small">
                                <span>📍 ${trip.origin}</span>
                                <span class="arrow">→</span>
                                <span>📍 ${trip.destination}</span>
                            </div>
                            <div class="trip-date">${tripDate}</div>
                        </div>
                        <div class="earning-amount-small">+RD$${driverEarning}</div>
                    </div>
                `;
            });
            
            earningsHistory.innerHTML = historyHTML || '<p>No hay historial disponible</p>';
        });
        
    } catch (error) {
        console.error('Error loading earnings:', error);
        document.getElementById('earningsHistory').innerHTML = '<p>Error cargando historial</p>';
    }
}

// Mostrar mapa de tracking en tiempo real
function showTrackingMap(tripId, userType) {
    currentTripId = tripId;
    
    const container = userType === 'driver' ? 
        document.getElementById('trackingMapContainer') : 
        document.getElementById('userTrackingMapContainer');
    
    const mapElement = userType === 'driver' ? 
        document.getElementById('trackingMap') : 
        document.getElementById('userTrackingMap');
    
    container.style.display = 'block';
    
    // Inicializar mapa
    setTimeout(() => {
        initTrackingMap(mapElement, tripId, userType);
    }, 100);
}

// Ocultar mapa de tracking
function hideTrackingMap() {
    document.getElementById('trackingMapContainer').style.display = 'none';
    stopLocationTracking();
}

function hideUserTrackingMap() {
    document.getElementById('userTrackingMapContainer').style.display = 'none';
    stopLocationTracking();
}

// Inicializar mapa de tracking
function initTrackingMap(mapElement, tripId, userType) {
    const defaultLocation = { lat: 18.4861, lng: -69.9312 };
    
    trackingMap = new google.maps.Map(mapElement, {
        zoom: 15,
        center: defaultLocation,
        styles: [
            { elementType: 'geometry', stylers: [{ color: '#1A1A1A' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#EAEAEA' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2E2E2E' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#3B82F6' }] }
        ]
    });
    
    trackingDirectionsRenderer = new google.maps.DirectionsRenderer({
        polylineOptions: { strokeColor: '#22C55E', strokeWeight: 4 }
    });
    trackingDirectionsRenderer.setMap(trackingMap);
    
    // Obtener datos del viaje
    getTripData(tripId).then(tripData => {
        if (tripData) {
            setupTrackingMarkers(tripData, userType);
            if (userType === 'driver') {
                startDriverLocationTracking(tripId, tripData);
            } else {
                startUserLocationTracking(tripId, tripData);
            }
        }
    });
}

// Obtener datos del viaje
async function getTripData(tripId) {
    try {
        const tripDoc = await window.getDoc(window.doc(window.db, 'trips', tripId));
        return tripDoc.exists() ? tripDoc.data() : null;
    } catch (error) {
        console.error('Error getting trip data:', error);
        return null;
    }
}

// Configurar marcadores de tracking
function setupTrackingMarkers(tripData, userType) {
    // Marcador del punto de recogida (usuario)
    const pickupLocation = geocodeAddress(tripData.origin);
    pickupLocation.then(coords => {
        if (coords) {
            userMarker = new google.maps.Marker({
                position: coords,
                map: trackingMap,
                title: 'Punto de recogida',
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#3B82F6',
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2
                }
            });
            
            // Centrar mapa en el punto de recogida
            trackingMap.setCenter(coords);
        }
    });
}

// Geocodificar dirección
async function geocodeAddress(address) {
    return new Promise((resolve) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                resolve(results[0].geometry.location.toJSON());
            } else {
                resolve(null);
            }
        });
    });
}

// Iniciar tracking de ubicación del conductor
function startDriverLocationTracking(tripId, tripData) {
    if (navigator.geolocation) {
        locationWatcher = navigator.geolocation.watchPosition(
            (position) => {
                const driverLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                updateDriverLocation(tripId, driverLocation);
                updateDriverMarker(driverLocation);
                calculateRouteToPickup(driverLocation, tripData.origin);
            },
            (error) => {
                console.error('Error getting location:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            }
        );
    }
}

// Iniciar tracking para el usuario (escuchar ubicación del conductor)
function startUserLocationTracking(tripId, tripData) {
    const tripRef = window.doc(window.db, 'trips', tripId);
    
    window.onSnapshot(tripRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            if (data.driverLocation) {
                updateDriverMarker(data.driverLocation);
                calculateRouteToPickup(data.driverLocation, tripData.origin);
            }
        }
    });
}

// Actualizar ubicación del conductor en Firebase
async function updateDriverLocation(tripId, location) {
    try {
        await window.updateDoc(window.doc(window.db, 'trips', tripId), {
            driverLocation: location,
            lastLocationUpdate: new Date()
        });
    } catch (error) {
        console.error('Error updating driver location:', error);
    }
}

// Actualizar marcador del conductor
function updateDriverMarker(location) {
    if (driverMarker) {
        driverMarker.setPosition(location);
    } else {
        driverMarker = new google.maps.Marker({
            position: location,
            map: trackingMap,
            title: 'Conductor',
            icon: {
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                fillColor: '#22C55E',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                scale: 1.5,
                anchor: new google.maps.Point(12, 24)
            }
        });
    }
    
    // Centrar mapa en el conductor
    trackingMap.panTo(location);
}

// Calcular ruta al punto de recogida
function calculateRouteToPickup(driverLocation, pickupAddress) {
    const directionsService = new google.maps.DirectionsService();
    
    geocodeAddress(pickupAddress).then(pickupCoords => {
        if (pickupCoords) {
            directionsService.route({
                origin: driverLocation,
                destination: pickupCoords,
                travelMode: google.maps.TravelMode.DRIVING
            }, (response, status) => {
                if (status === 'OK') {
                    trackingDirectionsRenderer.setDirections(response);
                    
                    // Mostrar tiempo estimado
                    const duration = response.routes[0].legs[0].duration.text;
                    updateETA(duration);
                }
            });
        }
    });
}

// Actualizar tiempo estimado de llegada
function updateETA(duration) {
    const etaElement = document.querySelector('.eta-info');
    if (!etaElement) {
        const tripInfo = document.querySelector('.trip-info-card') || document.querySelector('.driver-info');
        if (tripInfo) {
            const etaDiv = document.createElement('div');
            etaDiv.className = 'eta-info';
            etaDiv.innerHTML = `
                <div class="eta-container">
                    <span class="eta-icon">⏱️</span>
                    <span class="eta-text">Tiempo estimado: <strong>${duration}</strong></span>
                </div>
            `;
            tripInfo.appendChild(etaDiv);
        }
    } else {
        etaElement.querySelector('.eta-text').innerHTML = `Tiempo estimado: <strong>${duration}</strong>`;
    }
}

// Inicializar mapa de tracking en vivo
function initLiveTrackingMap(tripId, tripData) {
    const mapContainer = document.getElementById('liveTrackingMap');
    if (!mapContainer || !window.google) return;
    
    liveTrackingMap = new google.maps.Map(mapContainer, {
        zoom: 14,
        center: { lat: 18.4861, lng: -69.9312 },
        mapTypeId: 'roadmap',
        styles: [
            { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#3B82F6' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] }
        ]
    });
    
    liveDirectionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: { 
            strokeColor: '#22C55E', 
            strokeWeight: 5,
            strokeOpacity: 0.8
        }
    });
    liveDirectionsRenderer.setMap(liveTrackingMap);
    
    // Configurar marcadores y tracking
    setupLiveTracking(tripId, tripData);
    
    // Si ya hay ubicación del conductor, mostrarla inmediatamente
    if (tripData.driverLocation) {
        updateLiveDriverLocation(tripData.driverLocation, tripData);
    }
}

// Configurar tracking en vivo
function setupLiveTracking(tripId, tripData) {
    // Marcador del destino
    geocodeAddress(tripData.destination).then(destCoords => {
        if (destCoords) {
            new google.maps.Marker({
                position: destCoords,
                map: liveTrackingMap,
                title: 'Destino',
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                        '<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
                        '<circle cx="20" cy="20" r="18" fill="#4CAF50" stroke="white" stroke-width="3"/>' +
                        '<text x="20" y="26" text-anchor="middle" fill="white" font-size="16">🏁</text>' +
                        '</svg>'
                    ),
                    scaledSize: new google.maps.Size(40, 40)
                }
            });
        }
    });
    
    // Escuchar ubicación del conductor en tiempo real
    const tripRef = window.doc(window.db, 'trips', tripId);
    window.onSnapshot(tripRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            if (data.driverLocation) {
                updateLiveDriverLocation(data.driverLocation, tripData);
            }
        }
    });
}

// Actualizar ubicación del conductor en tiempo real
function updateLiveDriverLocation(driverLocation, tripData) {
    if (!liveTrackingMap || !driverLocation) return;
    
    // Actualizar marcador del conductor
    if (driverMarker) {
        driverMarker.setPosition(driverLocation);
    } else {
        driverMarker = new google.maps.Marker({
            position: driverLocation,
            map: liveTrackingMap,
            title: 'Conductor',
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                    '<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
                    '<circle cx="20" cy="20" r="18" fill="#2196F3" stroke="white" stroke-width="3"/>' +
                    '<text x="20" y="26" text-anchor="middle" fill="white" font-size="16">🚗</text>' +
                    '</svg>'
                ),
                scaledSize: new google.maps.Size(40, 40)
            }
        });
    }
    
    // Obtener ubicación actual del usuario
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            // Validar ubicación del usuario
            if (!validateUserLocation(position)) {
                console.warn('⚠️ Ubicación del usuario no válida');
                return;
            }
            
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
            };
            
            // Crear/actualizar marcador del usuario
            if (userMarker) {
                userMarker.setPosition(userLocation);
            } else {
                userMarker = new google.maps.Marker({
                    position: userLocation,
                    map: liveTrackingMap,
                    title: 'Tu ubicación',
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                            '<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
                            '<circle cx="20" cy="20" r="18" fill="#FF5722" stroke="white" stroke-width="3"/>' +
                            '<text x="20" y="26" text-anchor="middle" fill="white" font-size="16">👤</text>' +
                            '</svg>'
                        ),
                        scaledSize: new google.maps.Size(40, 40)
                    }
                });
            }
            
            // Crear trayectoria entre conductor y usuario
            if (typeof google !== 'undefined' && google.maps) {
                const directionsService = new google.maps.DirectionsService();
                directionsService.route({
                    origin: driverLocation,
                    destination: userLocation,
                    travelMode: google.maps.TravelMode.DRIVING,
                    avoidHighways: false,
                    avoidTolls: false
                }, (result, status) => {
                    if (status === 'OK' && liveDirectionsRenderer) {
                        liveDirectionsRenderer.setDirections(result);
                        const leg = result.routes[0].legs[0];
                        
                        // Actualizar información de ETA
                        const etaDisplay = document.getElementById('etaDisplay');
                        const distanceDisplay = document.getElementById('distanceDisplay');
                        const trackingStatus = document.getElementById('trackingStatus');
                        
                        if (etaDisplay) etaDisplay.textContent = `⏱️ ${leg.duration.text}`;
                        if (distanceDisplay) distanceDisplay.textContent = `📏 ${leg.distance.text}`;
                        if (trackingStatus) {
                            trackingStatus.innerHTML = `
                                <span class="status-indicator">✅</span>
                                <span class="status-text">Conductor rastreado (ubicación validada)</span>
                            `;
                        }
                        
                        // Ajustar vista para mostrar ambos puntos
                        const bounds = new google.maps.LatLngBounds();
                        bounds.extend(driverLocation);
                        bounds.extend(userLocation);
                        liveTrackingMap.fitBounds(bounds);
                    } else {
                        console.error('Error calculating route:', status);
                    }
                });
            }
        }, (error) => {
            console.error('Error getting user location for tracking:', error);
        }, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 10000
        });
    }
}

// Contactar conductor
function contactDriver(phone) {
    if (phone) {
        window.open(`tel:${phone}`);
    } else {
        showAlert('Número no disponible', 'warning');
    }
}

// Geocodificar dirección
async function geocodeAddress(address) {
    return new Promise((resolve) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                resolve(results[0].geometry.location.toJSON());
            } else {
                resolve(null);
            }
        });
    });
}

// Inicializar mapa del conductor
function initDriverLiveMap(tripId, tripData) {
    const mapContainer = document.getElementById('driverLiveMap');
    if (!mapContainer || !window.google) return;
    
    driverLiveMap = new google.maps.Map(mapContainer, {
        zoom: 15,
        center: { lat: 18.4861, lng: -69.9312 },
        mapTypeId: 'roadmap'
    });
    
    driverDirectionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: { strokeColor: '#22C55E', strokeWeight: 4 }
    });
    driverDirectionsRenderer.setMap(driverLiveMap);
    
    // Configurar marcadores
    setupDriverTracking(tripId, tripData);
}

// Configurar tracking del conductor
function setupDriverTracking(tripId, tripData) {
    currentUserType = 'driver';
    
    // Marcador del punto de recogida
    geocodeAddress(tripData.origin).then(pickupCoords => {
        if (pickupCoords) {
            new google.maps.Marker({
                position: pickupCoords,
                map: driverLiveMap,
                title: 'Cliente',
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                        '<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
                        '<circle cx="20" cy="20" r="18" fill="#FF5722" stroke="white" stroke-width="3"/>' +
                        '<text x="20" y="26" text-anchor="middle" fill="white" font-size="16">👤</text>' +
                        '</svg>'
                    ),
                    scaledSize: new google.maps.Size(40, 40)
                }
            });
            
            // Centrar mapa en el cliente
            driverLiveMap.setCenter(pickupCoords);
        }
    });
    
    // Marcador del destino
    geocodeAddress(tripData.destination).then(destCoords => {
        if (destCoords) {
            new google.maps.Marker({
                position: destCoords,
                map: driverLiveMap,
                title: 'Destino',
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                        '<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
                        '<circle cx="20" cy="20" r="18" fill="#4CAF50" stroke="white" stroke-width="3"/>' +
                        '<text x="20" y="26" text-anchor="middle" fill="white" font-size="16">🏁</text>' +
                        '</svg>'
                    ),
                    scaledSize: new google.maps.Size(40, 40)
                }
            });
        }
    });
    
    // Iniciar tracking de ubicación del conductor
    startDriverLocationUpdates(tripId, tripData);
}

// Iniciar actualizaciones de ubicación del conductor
function startDriverLocationUpdates(tripId, tripData) {
    if (navigator.geolocation) {
        // Limpiar watcher anterior si existe
        if (locationWatcher) {
            navigator.geolocation.clearWatch(locationWatcher);
        }
        
        locationWatcher = navigator.geolocation.watchPosition(
            (position) => {
                // Validar que la ubicación sea real antes de procesarla
                if (validateRealLocation(position)) {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp,
                        altitude: position.coords.altitude,
                        heading: position.coords.heading,
                        speed: position.coords.speed
                    };
                    updateDriverMapLocation(tripId, location, tripData);
                } else {
                    console.warn('⚠️ Ubicación del conductor no válida, ignorando...');
                    showAlert('Ubicación no válida detectada. Verifica tu GPS.', 'warning');
                }
            },
            (error) => {
                console.error('Error getting driver location:', error);
                let errorMessage = 'Error al obtener ubicación del conductor';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Permisos de ubicación denegados';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Ubicación no disponible';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Tiempo de espera agotado';
                        break;
                }
                showAlert(errorMessage, 'warning');
            },
            { 
                enableHighAccuracy: true, 
                timeout: 15000, 
                maximumAge: 0 // No usar ubicación en caché
            }
        );
        
        // Agregar al cleanup manager
        cleanupManager.addWatcher(locationWatcher);
    }
}

// Actualizar ubicación del conductor en el mapa
async function updateDriverMapLocation(tripId, location, tripData) {
    try {
        // Validar movimiento real si hay ubicación anterior
        if (window.lastDriverLocation) {
            const timeDiff = Date.now() - (window.lastDriverLocation.timestamp || Date.now());
            if (!detectRealMovement(location, window.lastDriverLocation, timeDiff)) {
                console.warn('⚠️ Movimiento del conductor no válido, ignorando...');
                return;
            }
        }
        
        // Guardar ubicación anterior para comparación
        window.lastDriverLocation = location;
        
        // Actualizar en Firebase con timestamp y validación
        await window.updateDoc(window.doc(window.db, 'trips', tripId), {
            driverLocation: location,
            lastLocationUpdate: new Date(),
            timestamp: Date.now(),
            locationValidated: true,
            accuracy: location.accuracy
        });
        
        console.log('✅ Driver location updated and validated:', location);
        
        // Actualizar marcador del conductor con animación suave
        if (driverMarker) {
            // Animación suave del marcador
            const currentPos = driverMarker.getPosition();
            if (currentPos) {
                const distance = google.maps.geometry.spherical.computeDistanceBetween(
                    currentPos, new google.maps.LatLng(location.lat, location.lng)
                );
                // Solo actualizar si hay movimiento significativo (más de 5 metros)
                if (distance > 5) {
                    driverMarker.setPosition(location);
                }
            } else {
                driverMarker.setPosition(location);
            }
        } else {
            driverMarker = new google.maps.Marker({
                position: location,
                map: driverLiveMap,
                title: 'Tu ubicación',
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                        '<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
                        '<circle cx="20" cy="20" r="18" fill="#2196F3" stroke="white" stroke-width="3"/>' +
                        '<text x="20" y="26" text-anchor="middle" fill="white" font-size="16">🚗</text>' +
                        '</svg>'
                    ),
                    scaledSize: new google.maps.Size(40, 40)
                }
            });
        }
        
        // Verificar estado del viaje para determinar destino
        const tripDoc = await window.getDoc(window.doc(window.db, 'trips', tripId));
        if (tripDoc.exists()) {
            const currentTripData = tripDoc.data();
            const destination = currentTripData.status === 'in_progress' ? tripData.destination : tripData.origin;
            
            // Calcular ruta según el estado del viaje
            geocodeAddress(destination).then(destCoords => {
                if (destCoords) {
                    const directionsService = new google.maps.DirectionsService();
                    directionsService.route({
                        origin: location,
                        destination: destCoords,
                        travelMode: google.maps.TravelMode.DRIVING,
                        avoidHighways: false,
                        avoidTolls: false
                    }, (result, status) => {
                        if (status === 'OK') {
                            driverDirectionsRenderer.setDirections(result);
                            const leg = result.routes[0].legs[0];
                            const etaElement = document.getElementById('driverEtaDisplay');
                            const distanceElement = document.getElementById('driverDistanceDisplay');
                            if (etaElement) etaElement.textContent = `⏱️ ${leg.duration.text}`;
                            if (distanceElement) distanceElement.textContent = `📏 ${leg.distance.text}`;
                        }
                    });
                }
            });
        }
        
    } catch (error) {
        console.error('Error updating driver location:', error);
    }
}

// Marcar llegada del conductor
async function markDriverArrived(tripId) {
    try {
        // Obtener datos del conductor
        const currentUser = window.auth.currentUser;
        const driverName = currentUser?.displayName || 'Conductor';
        
        await window.updateDoc(window.doc(window.db, 'trips', tripId), {
            status: 'driver_arrived',
            arrivedAt: new Date(),
            driverArrivedMessage: `El conductor ${driverName} está en el punto de encuentro. Asegúrate de que sea él antes de que el viaje inicie.`
        });
        
        // Actualizar UI del conductor
        document.getElementById('arrivedBtn').style.display = 'none';
        document.getElementById('startTripBtn').style.display = 'block';
        
        const currentStep = document.getElementById('currentStep');
        const arrivedStep = document.getElementById('arrivedStep');
        
        currentStep.classList.remove('active');
        currentStep.classList.add('completed');
        arrivedStep.classList.add('active');
        arrivedStep.innerHTML = `
            <div class="step-dot completed">✓</div>
            <span>Llegada</span>
        `;
        
        showAlert('✅ Llegada confirmada. Cliente notificado.', 'success');
        
    } catch (error) {
        console.error('Error marking arrival:', error);
        showAlert('Error al confirmar llegada', 'error');
    }
}

// Iniciar viaje
async function startTrip(tripId) {
    try {
        // Obtener datos del viaje
        const tripDoc = await window.getDoc(window.doc(window.db, 'trips', tripId));
        if (!tripDoc.exists()) return;
        
        const tripData = tripDoc.data();
        
        await window.updateDoc(window.doc(window.db, 'trips', tripId), {
            status: 'in_progress',
            startedAt: new Date()
        });
        
        // Actualizar UI
        document.getElementById('startTripBtn').style.display = 'none';
        document.getElementById('completeTripBtn').style.display = 'block';
        
        const arrivedStep = document.getElementById('arrivedStep');
        const completedStep = document.getElementById('completedStep');
        
        arrivedStep.classList.remove('active');
        arrivedStep.classList.add('completed');
        completedStep.classList.add('active');
        
        // Cambiar ruta al destino final
        changeRouteToDestination(tripData);
        
        showAlert('🚀 Viaje iniciado. Dirígete al destino.', 'success');
        
    } catch (error) {
        console.error('Error starting trip:', error);
        showAlert('Error al iniciar viaje', 'error');
    }
}

// Cambiar ruta al destino final
function changeRouteToDestination(tripData) {
    if (!driverMarker || !driverLiveMap) return;
    
    const driverLocation = driverMarker.getPosition();
    if (!driverLocation) return;
    
    geocodeAddress(tripData.destination).then(destCoords => {
        if (destCoords) {
            const directionsService = new google.maps.DirectionsService();
            directionsService.route({
                origin: driverLocation,
                destination: destCoords,
                travelMode: google.maps.TravelMode.DRIVING
            }, (result, status) => {
                if (status === 'OK') {
                    driverDirectionsRenderer.setDirections(result);
                    const leg = result.routes[0].legs[0];
                    document.getElementById('driverEtaDisplay').textContent = `⏱️ ${leg.duration.text}`;
                    document.getElementById('driverDistanceDisplay').textContent = `📏 ${leg.distance.text}`;
                    
                    // Ajustar vista del mapa para mostrar toda la ruta
                    const bounds = new google.maps.LatLngBounds();
                    bounds.extend(driverLocation);
                    bounds.extend(destCoords);
                    driverLiveMap.fitBounds(bounds);
                }
            });
        }
    });
}

// Detener tracking de ubicación
function stopLocationTracking() {
    if (locationWatcher) {
        navigator.geolocation.clearWatch(locationWatcher);
        locationWatcher = null;
    }
    
    if (driverMarker) {
        driverMarker.setMap(null);
        driverMarker = null;
    }
    
    if (userMarker) {
        userMarker.setMap(null);
        userMarker = null;
    }
    
    if (trackingDirectionsRenderer) {
        trackingDirectionsRenderer.setMap(null);
    }
    
    trackingMap = null;
    currentTripId = null;
}

// Iniciar sesión con Firebase
async function loginUser(email, password) {
    try {
        const userCredential = await window.signInWithEmailAndPassword(
            window.auth, 
            email, 
            password
        );
        return userCredential.user;
    } catch (error) {
        throw error;
    }
}
