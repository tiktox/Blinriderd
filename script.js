// ================= CONFIGURACIÓN DE FIREBASE =================
// Firebase configuration and initialization
const firebaseConfig = {
    apiKey: "tu-api-key",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "tu-messaging-sender-id",
    appId: "tu-app-id"
};

// Inicializar Firebase solo si no se ha inicializado previamente
if (!window.firebaseInitialized) {
    try {
        // Inicializar Firebase
        window.firebaseApp = window.initializeApp(firebaseConfig);
        window.db = window.getFirestore(window.firebaseApp);
        window.auth = window.getAuth(window.firebaseApp);
        
        // Hacer disponibles las funciones de Firebase
        window.collection = window.collection;
        window.doc = window.doc;
        window.query = window.query;
        window.where = window.where;
        window.onSnapshot = window.onSnapshot;
        window.setDoc = window.setDoc;
        window.updateDoc = window.updateDoc;
        window.createUserWithEmailAndPassword = window.createUserWithEmailAndPassword;
        window.signInWithEmailAndPassword = window.signInWithEmailAndPassword;
        window.updateProfile = window.updateProfile;
        
        window.firebaseInitialized = true;
        console.log("Firebase inicializado correctamente");
    } catch (error) {
        console.error("Error inicializando Firebase:", error);
    }
}

// Verificar conexión con Firebase
function checkFirebaseConnection() {
    if (window.auth && window.db) {
        console.log('Firebase inicializado correctamente');
        return true;
    } else {
        console.error('Firebase no está inicializado correctamente');
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
        // Verificar que Firebase esté inicializado
        if (!checkFirebaseConnection()) {
            throw new Error('Firebase no está disponible');
        }
        
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
        console.error('Error en registerUser:', error);
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
                default:
                    errorMessage = error.message || 'Error desconocido';
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
                default:
                    errorMessage = error.message || 'Error desconocido';
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
                default:
                    errorMessage = error.message || 'Error desconocido';
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
                default:
                    errorMessage = error.message || 'Error desconocido';
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
        // Verificar que Firebase esté inicializado
        if (!checkFirebaseConnection()) {
            throw new Error('Firebase no está disponible');
        }
        
        const user = window.auth.currentUser;
        if (!user) return;
        
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
        
        console.log('Guardando viaje con datos:', tripDoc);
        
        await window.setDoc(window.doc(window.db, 'trips', tripId), tripDoc);
        
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
            console.log('Cambio de estado del viaje:', trip.status);
            
            if (trip.status === 'accepted') {
                showTripAccepted(trip);
            } else if (trip.status === 'completed') {
                showTripCompleted(trip);
            } else if (trip.status === 'cancelled') {
                showAlert('Viaje cancelado', 'warning');
                showSection('home');
            }
        }
    }, (error) => {
        console.error('Error en listener de viaje:', error);
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
        // Verificar que Firebase esté inicializado
        if (!checkFirebaseConnection()) {
            throw new Error('Firebase no está disponible');
        }
        
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
        // Verificar que Firebase esté inicializado
        if (!checkFirebaseConnection()) {
            throw new Error('Firebase no está disponible');
        }
        
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
            console.log('Viajes de usuario encontrados:', snapshot.size);
            
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
        }, (error) => {
            console.error('Error en listener de viajes de usuario:', error);
            activityList.innerHTML = '<p>Error cargando viajes</p>';
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
let tripsListener = null;

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
function loadAvailableTrips() {
    // Verificar que Firebase esté inicializado
    if (!checkFirebaseConnection()) {
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
        const tripsRef = window.collection(window.db, 'trips');
        const searchingTrips = window.query(tripsRef, window.where('status', '==', 'searching'));
        
        // Escuchar cambios en tiempo real
        tripsListener = window.onSnapshot(searchingTrips, 
            (snapshot) => {
                console.log(`Snapshot recibido: ${snapshot.size} viajes`);
                console.log('Snapshot vacío:', snapshot.empty);
                
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
            },
            (error) => {
                console.error('Error en listener de viajes:', error);
                tripsList.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        );
        
    } catch (error) {
        console.error('Error creando query de viajes:', error);
        tripsList.innerHTML = '<p>Error conectando con Firebase</p>';
    }
}

// Formatear tiempo
function formatTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    
    return date.toLocaleDateString('es-ES');
}

// Aceptar viaje
async function acceptTrip(tripId) {
    try {
        // Verificar que Firebase esté inicializado
        if (!checkFirebaseConnection()) {
            throw new Error('Firebase no está disponible');
        }
        
        const user = window.auth.currentUser;
        if (!user) return;
        
        // Obtener datos del conductor
        const userDoc = await window.getDoc(window.doc(window.db, 'users', user.uid));
        const userData = userDoc.data();
        
        // Actualizar estado del viaje
        await window.updateDoc(window.doc(window.db, 'trips', tripId), {
            status: 'accepted',
            driverId: user.uid,
            driverName: user.displayName || userData.firstName + ' ' + userData.lastName,
            driverPhone: user.phoneNumber || userData.phone,
            acceptedAt: new Date()
        });
        
        showAlert('¡Viaje aceptado!', 'success');
        
        // Actualizar UI
        const tripCard = document.querySelector(`.trip-card[data-trip-id="${tripId}"]`);
        if (tripCard) {
            tripCard.remove();
        }
        
    } catch (error) {
        console.error('Error aceptando viaje:', error);
        showAlert('Error al aceptar el viaje', 'error');
    }
}

// Rechazar viaje
async function declineTrip(tripId) {
    try {
        // Verificar que Firebase esté inicializado
        if (!checkFirebaseConnection()) {
            throw new Error('Firebase no está disponible');
        }
        
        // Actualizar estado del viaje
        await window.updateDoc(window.doc(window.db, 'trips', tripId), {
            status: 'declined',
            declinedAt: new Date()
        });
        
        // Actualizar UI
        const tripCard = document.querySelector(`.trip-card[data-trip-id="${tripId}"]`);
        if (tripCard) {
            tripCard.remove();
        }
        
    } catch (error) {
        console.error('Error rechazando viaje:', error);
    }
}

// Mostrar sección específica
function showSection(sectionId) {
    const sections = document.querySelectorAll('.app-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    document.getElementById(sectionId).style.display = 'block';
    
    if (sectionId === 'activity') {
        loadUserTrips();
    }
}

// Iniciar sesión de usuario
async function loginUser(email, password) {
    try {
        // Verificar que Firebase esté inicializado
        if (!checkFirebaseConnection()) {
            throw new Error('Firebase no está disponible');
        }
        
        const userCredential = await window.signInWithEmailAndPassword(
            window.auth, 
            email, 
            password
        );
        
        return userCredential.user;
    } catch (error) {
        console.error('Error en loginUser:', error);
        throw error;
    }
}
