const mongoose = require('mongoose');

const MetricSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: Number, required: true },
  timestamp: { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('Metric', MetricSchema);


