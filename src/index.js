const express = require('express');
const app = express();

// Middleware
app.use(express.json());

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

// Metrics endpoint (voor Prometheus)
app.get('/metrics', (req, res) => {
  const metrics = `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/",status="200"} ${requestCount}

# HELP app_info Application information
# TYPE app_info gauge
app_info{version="${process.env.APP_VERSION || '1.0.0'}"} 1

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime()}
`;
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// Request counter voor metrics
let requestCount = 0;

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
const PORT = process.env.PORT || 10000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
  });
}

module.exports = app;
