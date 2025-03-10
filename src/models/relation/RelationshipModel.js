import mongoose from 'mongoose';

const relationshipSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Relationship = mongoose.model('Relationship', relationshipSchema);
export default Relationship;
