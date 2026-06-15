const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Metric = require('./models/Metric');
const Alert = require('./models/Alert');
const alertRoutes = require('./routes/alerts');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/alerts', alertRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// MongoDB connection
mongoose.connect('mongodb+srv://Bipasha12389:Bipasha1234@cluster0.7pakdqo.mongodb.net/metricdb?retryWrites=true&w=majority')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Seed metric names and initial ranges
const metricsConfig = {
  'Active Users': { min: 50, max: 200 },
  'Transactions': { min: 10, max: 50 },
  'Sales': { min: 1000, max: 5000 },
  'Response Time': { min: 100, max: 500 },
  'Error Rate': { min: 0, max: 5 },
  'CPU Usage': { min: 20, max: 80 }
};

let metricState = Object.entries(metricsConfig).map(([name, range]) => ({
  name,
  value: Math.floor(Math.random() * (range.max - range.min) + range.min),
  timestamp: new Date()
}));

// Simulate metrics update
setInterval(async () => {
  metricState = metricState.map(metric => {
    const delta = Math.floor(Math.random() * 11 - 5); // -5..5
    const newValue = Math.max(0, metric.value + delta);
    return { ...metric, value: newValue, timestamp: new Date() };
  });

  // Save each updated metric and emit to clients
  for (const metric of metricState) {
    try {
      const metricDoc = new Metric(metric);
      await metricDoc.save();
      io.emit('metric_update', metric);
    } catch (err) {
      console.error('Error saving metric:', err.message);
    }
  }
}, 3000);

// API to get latest metrics (one per metric name)
app.get('/api/metrics', async (req, res) => {
  try {
    // Get recent metrics and pick latest per name
    const dbMetrics = await Metric.find().sort({ timestamp: -1 }).limit(1000);
    const grouped = {};
    dbMetrics.forEach(m => {
      if (!grouped[m.name]) grouped[m.name] = m;
    });
    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API to get historical data for a specific metric
app.get('/api/metrics/:name/history', async (req, res) => {
  try {
    const { name } = req.params;
    const hours = Number(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const history = await Metric.find({
      name,
      timestamp: { $gte: since }
    })
    .sort({ timestamp: 1 })
    .select('value timestamp -_id');

    res.json(history);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API to get aggregated metrics (min, max, avg) for a time period
app.get('/api/metrics/aggregate', async (req, res) => {
  try {
    const hours = Number(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const aggregates = await Metric.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: '$name', min: { $min: '$value' }, max: { $max: '$value' }, avg: { $avg: '$value' } } }
    ]);

    res.json(aggregates);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  // Send initial state
  socket.emit('initial_metrics', metricState);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
