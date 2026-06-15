const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    metricName: {
        type: String,
        required: true
    },
    threshold: {
        type: Number,
        required: true
    },
    condition: {
        type: String,
        enum: ['above', 'below'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'resolved'],
        default: 'active'
    },
    triggeredAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: {
        type: Date
    }
});

module.exports = mongoose.model('Alert', AlertSchema);