const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Inicializar Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(require('./firebase-admin-key.json')),
    databaseURL: "https://golibre-27e90-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

// Configuración de tarifas (solo servidor)
const FARE_CONFIG = {
    pricePerKm: 30.00,
    platformFee: 0.05,
    minimumFare: 50.00,
    maxDistance: 100
};

// Endpoint para calcular tarifa
app.post('/api/calculate-fare', async (req, res) => {
    try {
        // Verificar autenticación
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token requerido' });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        const { distance, duration, origin, destination } = req.body;
        
        // Validar distancia
        const dist = parseFloat(distance);
        if (!dist || dist <= 0 || dist > FARE_CONFIG.maxDistance) {
            return res.status(400).json({ error: 'Distancia inválida' });
        }
        
        // Calcular tarifa
        let totalFare = dist * FARE_CONFIG.pricePerKm;
        if (totalFare < FARE_CONFIG.minimumFare) {
            totalFare = FARE_CONFIG.minimumFare;
        }
        
        const platformCommission = totalFare * FARE_CONFIG.platformFee;
        const driverEarnings = totalFare - platformCommission;
        const fareId = `fare_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Guardar cálculo para validación
        await db.collection('fare_calculations').doc(fareId).set({
            userId: decodedToken.uid,
            distance: dist,
            totalFare,
            platformCommission,
            driverEarnings,
            calculatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        res.json({
            fareId,
            totalFare: Math.round(totalFare * 100) / 100,
            platformCommission: Math.round(platformCommission * 100) / 100,
            driverEarnings: Math.round(driverEarnings * 100) / 100
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Validar tarifa antes de crear viaje
app.post('/api/validate-fare', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const decodedToken = await admin.auth().verifyIdToken(token);
        const { fareId } = req.body;
        
        const fareDoc = await db.collection('fare_calculations').doc(fareId).get();
        
        if (!fareDoc.exists || fareDoc.data().userId !== decodedToken.uid) {
            return res.status(400).json({ error: 'Tarifa inválida' });
        }
        
        res.json({ valid: true });
        
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});