const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const Metric = require('../models/Metric');

// Create a new alert
router.post('/', async (req, res) => {
    try {
        const alert = new Alert(req.body);
        await alert.save();
        res.status(201).json(alert);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all active alerts
router.get('/active', async (req, res) => {
    try {
        const alerts = await Alert.find({ status: 'active' });
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update alert status
router.patch('/:id', async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);
        if (req.body.status === 'resolved') {
            alert.resolvedAt = new Date();
        }
        alert.status = req.body.status;
        await alert.save();
        res.json(alert);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get metric statistics
router.get('/stats/:metricName', async (req, res) => {
    try {
        const { metricName } = req.params;
        const { hours = 24 } = req.query;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        const stats = await Metric.aggregate([
            {
                $match: {
                    name: metricName,
                    timestamp: { $gte: since }
                }
            },
            {
                $group: {
                    _id: null,
                    min: { $min: '$value' },
                    max: { $max: '$value' },
                    avg: { $avg: '$value' },
                    stdDev: { $stdDevPop: '$value' }
                }
            }
        ]);

        res.json(stats[0] || {});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;