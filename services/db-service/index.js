const express = require('express');
const client = require('prom-client');
const app = express();
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const dbQueries = new client.Counter({
    name: 'db_queries_total',
    help: 'Total database queries',
    labelNames: ['type'],
    registers: [register]
});
const dbConnections = new client.Gauge({
    name: 'db_active_connections',
    help: 'Active database connections',
    registers: [register]
});
const slowQueries = new client.Counter({
    name: 'db_slow_queries_total',
    help: 'Queries taking over 1 second',
    registers: [register]
});

setInterval(() => {
    dbQueries.inc({ type: 'select' }, Math.floor(Math.random() * 100));
    dbQueries.inc({ type: 'insert' }, Math.floor(Math.random() * 30));
    dbQueries.inc({ type: 'update' }, Math.floor(Math.random() * 20));
    dbConnections.set(Math.floor(Math.random() * 50) + 10);
    slowQueries.inc(Math.floor(Math.random() * 2));
}, 5000);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'db' }));
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});
app.listen(3003, () => console.log('db-service on :3003'));
