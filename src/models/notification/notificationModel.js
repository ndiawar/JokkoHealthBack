import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['appointment', 'sensor', 'emergency', 'medical', 'system'],
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    },
    reminderSent: {
        type: Boolean,
        default: false
    },
    reminderCount: {
        type: Number,
        default: 0
    },
    lastReminderSent: {
        type: Date,
        default: null
    },
    groupId: {
        type: String,
        default: null
    },
    groupType: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', null],
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index pour optimiser les requêtes
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ groupId: 1 });
notificationSchema.index({ createdAt: -1 }); // Nouvel index pour optimiser le tri

// Méthode statique pour créer une notification
notificationSchema.statics.createNotification = async function(data) {
    const notification = new this(data);
    await notification.save();
    return notification;
};

// Méthode pour marquer une notification comme lue
notificationSchema.methods.markAsRead = async function() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

// Méthode pour obtenir les notifications non lues d'un utilisateur
notificationSchema.statics.getUnreadNotifications = async function(userId) {
    return this.find({ userId, isRead: false })
        .sort({ createdAt: -1 });
};

// Méthode pour obtenir toutes les notifications d'un utilisateur
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
    const { limit = 20, skip = 0, type, priority } = options;
    const query = { userId };
    
    if (type) query.type = type;
    if (priority) query.priority = priority;
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

const Notification = mongoose.model('Notification', notificationSchema);

// ✅ Utiliser "export default" au lieu de "module.exports"
export default Notification;
