// models/logModel.js
import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    requestData: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Log', logSchema);
