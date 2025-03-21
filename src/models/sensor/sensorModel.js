import mongoose from 'mongoose';

const sensorSchema = new mongoose.Schema({
  sensorId: { 
    type: String, 
    unique: true,   // Assurez-vous que chaque capteur ait un identifiant unique
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',  // Référence à l'utilisateur auquel appartient ce capteur
    required: true 
  },
  mac: {
    type: String, 
    required: true, 
    unique: true  // Assurez-vous que chaque capteur ait une adresse MAC unique
  },
  heartRate: { 
    type: Number, 
    required: true 
  },
  spo2: { 
    type: Number, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  anomalies: {
    type: [String],  // Liste des anomalies détectées
    default: []
  },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive'], 
    default: 'Active'  // Statut du capteur
  }
}, { timestamps: true });

const Sensor = mongoose.model('Sensor', sensorSchema);
export default Sensor;
