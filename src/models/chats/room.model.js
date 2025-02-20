import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    _id_message: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }
}, { timestamps: true });

const Room = mongoose.model('Room', roomSchema);
export default Room;
