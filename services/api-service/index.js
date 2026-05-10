const express = require('express');
const client = require('prom-client');
const app = express();
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const log = (msg) => console.log(`${new Date().toISOString()} ${msg}`)

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

// simulate logs
const routes = [
    ['GET', '/v2/resource', 200],
    ['GET', '/v2/users', 200],
    ['POST', '/v2/submit', 201],
    ['DELETE', '/v2/resource', 204],
    ['GET', '/v2/stats', 200],
]
setInterval(() => {
    if (Math.random() < 0.2) return
    const roll = Math.random()
    if (roll < 0.75) {
        const [method, path, status] = routes[Math.floor(Math.random() * routes.length)]
        const duration = Math.floor(Math.random() * 120) + 10
        log(`${method} ${path} ${status} ${duration}ms`)
    } else if (roll < 0.9) {
        const duration = Math.floor(Math.random() * 600) + 500
        log(`WARN high latency detected: ${duration}ms on POST /v2/submit`)
    } else {
        log(`ERROR connection timeout to db-service after 5000ms`)
    }
}, 7000)

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api' }));
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});
app.listen(3002, () => log('api-service on :3002'));
