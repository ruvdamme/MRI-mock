const express = require('express');
const client = require('prom-client');
const app = express();
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const activeSessions = new client.Gauge({
    name: 'auth_active_sessions',
    help: 'Number of currently active user sessions',
    registers: [register]
});
const loginRate = new client.Counter({
    name: 'auth_logins_total',
    help: 'Total number of login attempts',
    labelNames: ['status'],
    registers: [register]
});

setInterval(() => {
    activeSessions.set(Math.floor(Math.random() * 200) + 50);
    loginRate.inc({ status: 'success' }, Math.floor(Math.random() * 10));
    loginRate.inc({ status: 'failure' }, Math.floor(Math.random() * 3));
}, 5000);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth' }));
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});
app.listen(3001, () => console.log('auth-service on :3001'));
