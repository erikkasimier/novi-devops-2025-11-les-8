const express = require('express');
const app = express();
const promClient = require('prom-client');

// Request counter voor metrics
let requestCount = 0;

// Prometheus metrics setup
promClient.collectDefaultMetrics();

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'endpoint', 'status']
});

const processUptimeSeconds = new promClient.Gauge({
  name: "process_uptime_seconds",
  help: "Process uptime in seconds",
  collect() {
    this.set(process.uptime());
  }
});

// Middleware
app.use(express.json());

// Middleware to count requests
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({
      method: req.method,
      endpoint: req.path,
      status: res.statusCode
    });
    processUptimeSeconds.set(process.uptime());
  });
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Les 8 API!',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint (voor Kubernetes probes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    requestNumber: requestCount
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.send(await promClient.register.metrics());
});

app.get('/api/items', (req, res) => {
  const items = require('./data');
  res.json(items.getAll());
});

app.get('/api/items/:id', (req, res) => {
  const items = require('./data');
  const item = items.getById(parseInt(req.params.id));

  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  res.json(item);
});

app.post('/api/items', (req, res) => {
  const items = require('./data');
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const newItem = items.create({ name, description });
  res.status(201).json(newItem);
});

app.get('/api/info', (req, res) => {
  requestCount++;
  res.json({
    app: 'DevOps Demo',
    version: process.env.APP_VERSION || '1.0.0',
    node_version: process.version,
    platform: process.platform,
    uptime: process.uptime()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server (only if not in test mode)
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
  });
}

module.exports = app;
