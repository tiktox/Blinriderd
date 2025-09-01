// Variables globales para el mapa
let map;
let pickupMarker;
let pickupLocation = null;

// Función para solicitar un viaje
function requestRide() {
    document.getElementById('rideRequestModal').style.display = 'flex';
    setTimeout(() => {
        initMap();
    }, 100);
}

// Cerrar modal de solicitud
function closeRideModal() {
    document.getElementById('rideRequestModal').style.display = 'none';
    pickupLocation = null;
    document.getElementById('confirmBtn').disabled = true;
    document.getElementById('pickupAddress').textContent = 'Selecciona en el mapa';
}

// Inicializar mapa
function initMap() {
    // Ubicación por defecto (Santo Domingo, RD)
    const defaultLocation = { lat: 18.4861, lng: -69.9312 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: defaultLocation,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
    
    // Intentar obtener ubicación actual
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(userLocation);
            },
            () => {
                console.log('No se pudo obtener la ubicación');
            }
        );
    }
    
    // Evento click en el mapa
    map.addListener('click', (event) => {
        setPickupLocation(event.latLng);
    });
}

// Establecer ubicación de partida
function setPickupLocation(location) {
    pickupLocation = location;
    
    // Remover marcador anterior si existe
    if (pickupMarker) {
        pickupMarker.setMap(null);
    }
    
    // Crear nuevo marcador
    pickupMarker = new google.maps.Marker({
        position: location,
        map: map,
        title: 'Punto de partida',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
        }
    });
    
    // Obtener dirección
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: location }, (results, status) => {
        if (status === 'OK' && results[0]) {
            document.getElementById('pickupAddress').textContent = results[0].formatted_address;
        } else {
            document.getElementById('pickupAddress').textContent = `${location.lat().toFixed(6)}, ${location.lng().toFixed(6)}`;
        }
    });
    
    // Habilitar botón de confirmar
    document.getElementById('confirmBtn').disabled = false;
}

// Confirmar solicitud de viaje
async function confirmRideRequest() {
    if (!pickupLocation) {
        alert('Por favor selecciona un punto de partida');
        return;
    }
    
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Debes estar logueado para solicitar un viaje');
            return;
        }
        
        // Crear solicitud de viaje
        const rideRequest = {
            userId: user.uid,
            userEmail: user.email,
            pickupLocation: {
                lat: pickupLocation.lat(),
                lng: pickupLocation.lng()
            },
            pickupAddress: document.getElementById('pickupAddress').textContent,
            status: 'pending',
            timestamp: new Date(),
            driverId: null
        };
        
        // Guardar en Firestore
        const docRef = await addDoc(collection(db, 'rideRequests'), rideRequest);
        
        alert('¡Solicitud enviada! Buscando conductor disponible...');
        closeRideModal();
        
        // Mostrar estado de búsqueda
        showSearchingDriver(docRef.id);
        
    } catch (error) {
        console.error('Error al solicitar viaje:', error);
        alert('Error al solicitar el viaje. Inténtalo de nuevo.');
    }
}

// Mostrar estado de búsqueda de conductor
function showSearchingDriver(requestId) {
    const mainApp = document.getElementById('mainApp');
    mainApp.innerHTML = `
        <div class="searching-driver">
            <div class="search-animation">
                <div class="pulse-circle"></div>
                <div class="car-icon">🚗</div>
            </div>
            <h2>Buscando conductor...</h2>
            <p>Te conectaremos con un conductor cercano</p>
            <button class="cancel-search-btn" onclick="cancelRideRequest('${requestId}')">Cancelar búsqueda</button>
        </div>
    `;
    
    // Escuchar cambios en la solicitud
    const unsubscribe = onSnapshot(doc(db, 'rideRequests', requestId), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            if (data.status === 'accepted' && data.driverId) {
                showDriverFound(data);
                unsubscribe();
            } else if (data.status === 'cancelled') {
                showMainApp();
                unsubscribe();
            }
        }
    });
}

// Cancelar solicitud de viaje
async function cancelRideRequest(requestId) {
    try {
        await updateDoc(doc(db, 'rideRequests', requestId), {
            status: 'cancelled'
        });
        showMainApp();
    } catch (error) {
        console.error('Error al cancelar:', error);
    }
}

// Mostrar conductor encontrado
function showDriverFound(rideData) {
    const mainApp = document.getElementById('mainApp');
    mainApp.innerHTML = `
        <div class="driver-found">
            <div class="driver-info">
                <h2>¡Conductor encontrado!</h2>
                <div class="driver-details">
                    <div class="driver-avatar">👨💼</div>
                    <div class="driver-name">${rideData.driverName || 'Conductor'}</div>
                </div>
            </div>
            <div class="trip-status">
                <p>El conductor se dirige a tu ubicación</p>
                <div class="pickup-location">
                    <strong>📍 Punto de partida:</strong>
                    <span>${rideData.pickupAddress}</span>
                </div>
            </div>
        </div>
    `;
}