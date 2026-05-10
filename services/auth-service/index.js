const express = require('express');
const client = require('prom-client');
const app = express();
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const log = (msg) => console.log(`${new Date().toISOString()} ${msg}`)

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

// simulate logs
const users = ['u_8821', 'u_4421', 'u_1337', 'u_9931', 'u_2210']
const randomUser = () => users[Math.floor(Math.random() * users.length)]
setInterval(() => {
    if (Math.random() < 0.6) return
    const roll = Math.random()
    if (roll < 0.7) {
        const duration = Math.floor(Math.random() * 80) + 10
        log(`user_login userId=${randomUser()} duration=${duration}ms`)
    } else if (roll < 0.9) {
        const duration = Math.floor(Math.random() * 20) + 5
        log(`token refresh userId=${randomUser()} duration=${duration}ms`)
    } else {
        log(`WARN invalid credentials userId=${randomUser()} attempts=3`)
    }
}, 20000)

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth' }));
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});
app.listen(3001, () => log('auth-service on :3001'));
