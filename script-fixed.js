// Variables globales
let tripsListener = null;
let driverOnline = false;
let map = null;
let currentLocationMarker = null;
let destinationMarker = null;
let directionsService = null;
let directionsRenderer = null;
let autocompleteDestination = null;

// Configuración de tarifas
const FARE_CONFIG = {
    pricePerKm: 30.00,
    platformFee: 0.05
};

// Check Firebase connection
function checkFirebaseConnection() {
    if (window.auth && window.db && window.collection && window.query && window.where && window.onSnapshot) {
        console.log('Firebase initialized successfully');
        return true;
    } else {
        console.error('Firebase not properly initialized');
        return false;
    }
}

// Mostrar alerta personalizada
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        padding: 15px 20px; border-radius: 8px; color: white;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
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
        center: defaultLocation
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
    
    const distanceInMeters = leg.distance.value;
    const distanceInKm = (distanceInMeters / 1000).toFixed(2);
    
    const totalFare = parseFloat(distanceInKm) * FARE_CONFIG.pricePerKm;
    const platformCommission = totalFare * FARE_CONFIG.platformFee;
    const driverEarnings = totalFare - platformCommission;
    
    document.getElementById('tripDistance').textContent = `${distanceInKm} km`;
    document.getElementById('totalFare').textContent = `RD$${totalFare.toFixed(2)}`;
    document.getElementById('fareInfo').style.display = 'block';
    
    window.currentTrip = {
        distance: distanceInKm,
        totalFare: totalFare,
        platformCommission: platformCommission,
        driverEarnings: driverEarnings,
        duration: leg.duration.text
    };
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
    
    closeRideModal();
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
            status: 'searching',
            createdAt: new Date(),
            timestamp: Date.now()
        };
        
        console.log('Saving trip with data:', tripDoc);
        
        const docRef = await window.addDoc(window.collection(window.db, 'trips'), tripDoc);
        
        console.log('Viaje guardado con ID:', docRef.id);
        showSearchingDriver(docRef.id);
        
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
            <h2>Buscando conductor...</h2>
            <p>Te conectaremos con un conductor cercano</p>
            <button class="cancel-trip-btn" onclick="cancelTrip('${tripId}')">Cancelar Viaje</button>
        </div>
    `;
    
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
            <h2>✅ Conductor asignado</h2>
            <p><strong>Conductor:</strong> ${trip.driverName}</p>
            <p>El conductor se dirige hacia ti</p>
        </div>
    `;
}

// Mostrar viaje completado
function showTripCompleted(trip) {
    const mainApp = document.getElementById('mainApp');
    const appContent = mainApp.querySelector('.app-content');
    
    appContent.innerHTML = `
        <div class="trip-completed-section">
            <h2>🎉 Viaje completado</h2>
            <p>¡Gracias por usar Blinriderd!</p>
            <p><strong>Total:</strong> RD$${trip.totalFare.toFixed(2)}</p>
            <button class="home-btn" onclick="showSection('home')">Volver al inicio</button>
        </div>
    `;
    
    setTimeout(() => showSection('home'), 5000);
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
            
            trips.sort((a, b) => b.timestamp - a.timestamp);
            
            trips.forEach((trip) => {
                const statusText = {
                    'searching': 'Buscando conductor',
                    'accepted': 'Conductor asignado',
                    'completed': 'Completado',
                    'cancelled': 'Cancelado'
                };
                
                tripsHTML += `
                    <div class="trip-history-card">
                        <div class="trip-header">
                            <span class="trip-status">${statusText[trip.status]}</span>
                        </div>
                        <div class="trip-route">
                            <div>📍 ${trip.origin}</div>
                            <div>📍 ${trip.destination}</div>
                        </div>
                        <div class="trip-details">
                            <span>RD$${trip.totalFare.toFixed(2)}</span>
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

// Mostrar interfaz principal después del login
function showMainApp(user) {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('navbar').style.display = 'block';
    document.getElementById('mainApp').style.display = 'block';
    
    if (user && user.displayName) {
        const firstName = user.displayName.split(' ')[0];
        document.getElementById('welcomeTitle').textContent = `¡Hola ${firstName}!`;
        document.getElementById('welcomeSubtitle').textContent = '¿A dónde quieres ir hoy?';
    }
}

// Mostrar interfaz del conductor
function showDriverApp(user) {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('navbar').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    
    document.getElementById('driverNavbar').style.display = 'block';
    document.getElementById('driverApp').style.display = 'block';
}

// Alternar estado del conductor
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
        
        setTimeout(() => loadAvailableTrips(), 100);
    } else {
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

// Cargar viajes disponibles en tiempo real
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
        const tripsRef = window.collection(window.db, 'trips');
        const searchingTrips = window.query(tripsRef, window.where('status', '==', 'searching'));
        
        console.log('Setting up trips listener...');
        
        tripsListener = window.onSnapshot(searchingTrips, 
            (snapshot) => {
                console.log(`Found ${snapshot.size} trips`);
                
                if (snapshot.empty) {
                    tripsList.innerHTML = '<p>No hay viajes disponibles</p>';
                    return;
                }
                
                let tripsHTML = '';
                snapshot.forEach((doc) => {
                    const trip = doc.data();
                    const tripId = doc.id;
                    
                    if (!trip.origin || !trip.destination || !trip.totalFare) {
                        console.warn('Trip missing required fields:', tripId);
                        return;
                    }
                    
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
                                    <span class="distance">${trip.distance || 'N/A'} km</span>
                                    <span class="fare">RD$${trip.totalFare.toFixed(2)}</span>
                                    <span class="earnings">Ganas: RD$${driverEarnings}</span>
                                </div>
                                <div class="trip-user">
                                    <span class="user-name">👤 ${trip.userName || 'Usuario'}</span>
                                    <span class="trip-time">Ahora</span>
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
            },
            (error) => {
                console.error('Firestore listener error:', error);
                tripsList.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        );
        
    } catch (error) {
        console.error('Setup error:', error);
        tripsList.innerHTML = '<p>Error en configuración</p>';
    }
}

// Aceptar viaje
async function acceptTrip(tripId) {
    try {
        const currentUser = window.auth.currentUser;
        if (!currentUser) return;
        
        await window.updateDoc(window.doc(window.db, 'trips', tripId), {
            status: 'accepted',
            driverId: currentUser.uid,
            driverName: currentUser.displayName || 'Conductor',
            acceptedAt: new Date()
        });
        
        showAlert('Viaje aceptado! Dirigiéndote al cliente...', 'success');
        
        if (tripsListener) {
            tripsListener();
            tripsListener = null;
        }
        
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
            <div class="trip-actions">
                <button class="complete-btn" onclick="completeTrip('${tripId}')">Completar Viaje</button>
            </div>
        </div>
    `;
}

// Rechazar viaje
function declineTrip(tripId) {
    showAlert('Viaje rechazado', 'warning');
}

// Completar viaje
async function completeTrip(tripId) {
    try {
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
            driverContent.innerHTML = `
                <div class="earnings-section">
                    <h2>💰 Mis Ganancias</h2>
                    <div class="earnings-summary">
                        <div class="earning-card">
                            <span class="amount">RD$0.00</span>
                            <span class="label">Hoy</span>
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

// Cerrar sesión
function logout() {
    if (window.auth && window.auth.currentUser) {
        window.auth.signOut().then(() => {
            document.getElementById('authContainer').style.display = 'flex';
            document.getElementById('navbar').style.display = 'none';
            document.getElementById('mainApp').style.display = 'none';
            document.getElementById('driverNavbar').style.display = 'none';
            document.getElementById('driverApp').style.display = 'none';
            
            document.querySelectorAll('.form-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById('user-form').classList.add('active');
            
            showAlert('Sesión cerrada correctamente', 'success');
        });
    }
}

// Mostrar sección de navegación
function showSection(section) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
    
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

// Mostrar formularios
function showLogin(userType) {
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(userType + '-login').classList.add('active');
}

function showRegister(userType) {
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(userType + '-form').classList.add('active');
}

function showDriverSection() {
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('driver-form').classList.add('active');
}

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

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    
    setTimeout(() => {
        console.log('Checking Firebase initialization...');
        checkFirebaseConnection();
    }, 1000);
    
    // User registration
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
            
            showAlert('¡Cuenta creada exitosamente!', 'success');
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

    // User login
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
            }
            
            showAlert(errorMessage, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Driver login
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
            }
            
            showAlert(errorMessage, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Driver registration
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
            
            showAlert('¡Solicitud enviada!', 'success');
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
            }
            
            showAlert(errorMessage, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
    
    // Phone formatting
    document.getElementById('userPhone').addEventListener('input', function() {
        formatPhoneNumber(this);
    });
    
    document.getElementById('driverPhone').addEventListener('input', function() {
        formatPhoneNumber(this);
    });
    
    // Modal click outside
    window.onclick = function(event) {
        const modal = document.getElementById('rideModal');
        if (event.target === modal) {
            closeRideModal();
        }
    };
});