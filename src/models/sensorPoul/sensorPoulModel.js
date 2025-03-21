// models/SensorPoul.js
import mongoose from 'mongoose';

const sensorPoulSchema = new mongoose.Schema({
  heartRate: Number, // Fréquence cardiaque
  oxygenLevel: Number, // Niveau d'oxygène
  timestamp: { type: Date, default: Date.now } // Horodatage
});

const SensorPoul = mongoose.model('SensorPoul', sensorPoulSchema);

export default SensorPoul;