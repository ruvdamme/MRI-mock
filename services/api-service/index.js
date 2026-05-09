const express = require('express');
const client = require('prom-client');
const app = express();
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequests = new client.Counter({
    name: 'api_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'status_code'],
    registers: [register]
});
const httpLatency = new client.Histogram({
    name: 'api_request_duration_seconds',
    help: 'Request latency in seconds',
    buckets: [0.05, 0.1, 0.3, 0.5, 1, 2],
    registers: [register]
});

setInterval(() => {
    const latency = Math.random() * 0.8;
    httpLatency.observe(latency);
    httpRequests.inc({ method: 'GET', status_code: '200' }, Math.floor(Math.random() * 50));
    httpRequests.inc({ method: 'POST', status_code: '200' }, Math.floor(Math.random() * 20));
    httpRequests.inc({ method: 'GET', status_code: '500' }, Math.floor(Math.random() * 3));
}, 5000);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api' }));
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});
app.listen(3002, () => console.log('api-service on :3002'));
