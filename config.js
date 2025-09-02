// Configuración de la aplicación Blinriderd
// ⚠️ IMPORTANTE: Este archivo debe estar en .gitignore en producción

const CONFIG = {
    // Firebase Configuration
    firebase: {
        apiKey: "AIzaSyC64S8YDVEoeyyteRix_TyItBWD49rDZbo",
        authDomain: "golibre-27e90.firebaseapp.com",
        databaseURL: "https://golibre-27e90-default-rtdb.firebaseio.com",
        projectId: "golibre-27e90",
        storageBucket: "golibre-27e90.firebasestorage.app",
        messagingSenderId: "936790658838",
        appId: "1:936790658838:web:cdbe7ea54b5b07cf654a37",
        measurementId: "G-7QJGPLHLZY"
    },
    
    // Google Maps Configuration
    googleMaps: {
        apiKey: "AIzaSyAoR6-zL2FzSiNTHDYclDo6nt689weOE0k",
        libraries: ["places"]
    },
    
    // App Configuration
    app: {
        name: "Blinriderd",
        version: "1.0.0",
        defaultLocation: {
            lat: 18.4861,
            lng: -69.9312
        },
        fare: {
            pricePerKm: 30.00,
            platformFee: 0.05
        }
    }
};

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
