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
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(tab + '-form').classList.add('active');
}

// Mostrar alerta personalizada
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.form-container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => alertDiv.remove(), 5000);
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

// Obtener ubicación actual
function getCurrentLocation() {
    const locationInput = document.getElementById('currentLocation');
    locationInput.value = 'Obteniendo ubicación...';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                setCurrentLocationMarker(pos);
                
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: pos }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        locationInput.value = results[0].formatted_address;
                    } else {
                        locationInput.value = `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
                    }
                });
            },
            () => {
                locationInput.value = 'No se pudo obtener la ubicación';
                showAlert('Error al obtener ubicación', 'warning');
            }
        );
    }
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
            // Mostrar contenedor de autenticación
            document.getElementById('authContainer').style.display = 'flex';
            
            // Ocultar barra de tareas y aplicación principal
            document.getElementById('navbar').style.display = 'none';
            document.getElementById('mainApp').style.display = 'none';
            
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
        if (!user) return;
        
        const tripId = Date.now().toString();
        await window.setDoc(window.doc(window.db, 'trips', tripId), {
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
        });
        
        console.log('Viaje guardado con ID:', tripId);
        console.log('Enviando a conductores conectados...');
        
        // Mostrar estado de búsqueda inmediatamente
        showSearchingDriver(tripId);
        
    } catch (error) {
        console.error('Error saving trip:', error);
        showAlert('Error al enviar el viaje', 'error');
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
        <div class="trip-accepted-section">
            <div class="driver-info">
                <h2>✅ Conductor asignado</h2>
                <p><strong>Conductor:</strong> ${trip.driverName}</p>
                <p>El conductor se dirige hacia ti</p>
            </div>
            <div class="trip-status">
                <div class="status-step completed">
                    <span class="step-icon">✓</span>
                    <span>Viaje confirmado</span>
                </div>
                <div class="status-step current">
                    <span class="step-icon">🚗</span>
                    <span>Conductor en camino</span>
                </div>
                <div class="status-step">
                    <span class="step-icon">📍</span>
                    <span>Viaje completado</span>
                </div>
            </div>
        </div>
    `;
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
                
                tripsHTML += `
                    <div class="trip-history-card">
                        <div class="trip-header">
                            <span class="trip-date">${formatTripDate(trip.createdAt.toDate())}</span>
                            <span class="trip-status ${statusClass[trip.status]}">${statusText[trip.status]}</span>
                        </div>
                        <div class="trip-route">
                            <div class="route-point">📍 ${trip.origin}</div>
                            <div class="route-arrow">→</div>
                            <div class="route-point">📍 ${trip.destination}</div>
                        </div>
                        <div class="trip-details">
                            <span class="trip-distance">${trip.distance} km</span>
                            <span class="trip-fare">RD$${trip.totalFare.toFixed(2)}</span>
                            ${trip.driverName ? `<span class="trip-driver">👤 ${trip.driverName}</span>` : ''}
                        </div>
                    </div>
                `;
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
                    <p>Conectando...</p>
                </div>
            </div>
        `;
        
        // Esperar a que el DOM se actualice antes de cargar viajes
        setTimeout(() => loadAvailableTrips(), 100);
    } else {
        // Limpiar listener al desconectarse
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
    // Verificar que Firebase esté inicializado
    if (!window.db || !window.collection || !window.query || !window.where || !window.onSnapshot) {
        console.error('Firebase no está inicializado correctamente');
        const tripsList = document.getElementById('tripsList');
        if (tripsList) {
            tripsList.innerHTML = '<p>Error: Firebase no disponible</p>';
        }
        return;
    }
    
    const tripsList = document.getElementById('tripsList');
    if (!tripsList) {
        console.error('Elemento tripsList no encontrado');
        return;
    }
    
    tripsList.innerHTML = '<p>Buscando viajes cercanos...</p>';
    
    // Limpiar listener anterior si existe
    if (tripsListener) {
        tripsListener();
        tripsListener = null;
    }
    
    try {
        // Consulta en tiempo real de viajes con estado "searching"
        const tripsQuery = window.query(
            window.collection(window.db, 'trips'),
            window.where('status', '==', 'searching')
        );
        
        // Escuchar cambios en tiempo real
        tripsListener = window.onSnapshot(tripsQuery, (snapshot) => {
            console.log('Snapshot recibido:', snapshot.size, 'viajes');
            
            if (snapshot.empty) {
                tripsList.innerHTML = '<p>No hay viajes disponibles</p>';
                return;
            }
            
            let tripsHTML = '';
            snapshot.forEach((doc) => {
                const trip = doc.data();
                const tripId = doc.id;
                
                console.log('Viaje encontrado:', tripId, trip);
                
                // Calcular ganancias del conductor (95%)
                const driverEarnings = (trip.totalFare * 0.95).toFixed(2);
                
                tripsHTML += `
                    <div class="trip-card" data-trip-id="${tripId}">
                        <div class="trip-info">
                            <div class="trip-route">
                                <div class="route-point">📍 ${trip.origin}</div>
                                <div class="route-arrow">→</div>
                                <div class="route-point">📍 ${trip.destination}</div>
                            </div>
                            <div class="trip-details">
                                <span class="distance">${trip.distance} km</span>
                                <span class="fare">RD$${trip.totalFare.toFixed(2)}</span>
                                <span class="earnings">Ganas: RD$${driverEarnings}</span>
                            </div>
                            <div class="trip-user">
                                <span class="user-name">👤 ${trip.userName}</span>
                                <span class="trip-time">${formatTime(trip.createdAt.toDate())}</span>
                            </div>
                        </div>
                        <div class="trip-actions">
                            <button class="accept-btn" onclick="acceptTrip('${tripId}')">Aceptar</button>
                            <button class="decline-btn" onclick="declineTrip('${tripId}')">Rechazar</button>
                        </div>
                    </div>
                `;
            });
            
            tripsList.innerHTML = tripsHTML;
        }, (error) => {
            console.error('Error en listener de viajes:', error);
            tripsList.innerHTML = '<p>Error cargando viajes</p>';
        });
        
    } catch (error) {
        console.error('Error creando query de viajes:', error);
        tripsList.innerHTML = '<p>Error conectando con Firebase</p>';
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
        
        // Actualizar estado del viaje en Firebase
        await window.updateDoc(window.doc(window.db, 'trips', tripId), {
            status: 'accepted',
            driverId: currentUser.uid,
            driverName: currentUser.displayName || 'Conductor',
            acceptedAt: new Date()
        });
        
        showAlert('Viaje aceptado! Dirigiéndote al cliente...', 'success');
        
        // Detener listener de viajes disponibles
        if (tripsListener) {
            tripsListener();
            tripsListener = null;
        }
        
        // Mostrar interfaz de viaje activo
        showActiveTrip(tripId);
        
    } catch (error) {
        console.error('Error accepting trip:', error);
        showAlert('Error al aceptar el viaje', 'error');
    }
}

// Mostrar viaje activo
function showActiveTrip(tripId) {
    const driverContent = document.getElementById('driverContent');
    driverContent.innerHTML = `
        <div class="active-trip">
            <h3>🎯 Viaje en Progreso</h3>
            <div class="trip-status">
                <div class="status-step active">
                    <span class="step-icon">✓</span>
                    <span>Viaje aceptado</span>
                </div>
                <div class="status-step current">
                    <span class="step-icon">🚗</span>
                    <span>Dirigiendote al cliente</span>
                </div>
                <div class="status-step">
                    <span class="step-icon">📍</span>
                    <span>Viaje completado</span>
                </div>
            </div>
            <div class="trip-actions">
                <button class="complete-btn" onclick="completeTrip('${tripId}')">Completar Viaje</button>
            </div>
        </div>
    `;
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
function showDriverSection(section) {
    document.querySelectorAll('#driverNavbar .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
    
    const driverContent = document.getElementById('driverContent');
    
    switch(section) {
        case 'trips':
            if (driverOnline) {
                driverContent.innerHTML = `
                    <div id="availableTrips" class="trips-container">
                        <h3>📍 Viajes Disponibles</h3>
                        <div class="trips-list" id="tripsList">
                            <p>Cargando...</p>
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
            driverContent.innerHTML = `
                <div class="earnings-section">
                    <h2>💰 Mis Ganancias</h2>
                    <div class="earnings-summary">
                        <div class="earning-card">
                            <span class="amount">RD$0.00</span>
                            <span class="label">Hoy</span>
                        </div>
                        <div class="earning-card">
                            <span class="amount">RD$0.00</span>
                            <span class="label">Esta semana</span>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'profile':
            const currentUser = window.auth?.currentUser;
            const userName = currentUser?.displayName || 'Conductor';
            driverContent.innerHTML = `
                <div class="profile-section">
                    <h2>👤 Mi Perfil</h2>
                    <div class="profile-info">
                        <p><strong>Nombre:</strong> ${userName}</p>
                        <p><strong>Estado:</strong> ${driverOnline ? 'Conectado' : 'Desconectado'}</p>
                    </div>
                </div>
            `;
            break;
    }
}

// Aplicar formato a números de teléfono
document.addEventListener('DOMContentLoaded', function() {
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
function showSection(section) {
    // Actualizar botones activos
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
    
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
