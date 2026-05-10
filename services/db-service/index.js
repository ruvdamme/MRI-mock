const express = require('express');
const client = require('prom-client');
const app = express();
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const log = (msg) => console.log(`${new Date().toISOString()} ${msg}`)

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

// simulate logs
const queries = [
    () => `SELECT query ${Math.floor(Math.random() * 50) + 5}ms rows=${Math.floor(Math.random() * 100)}`,
    () => `INSERT ${Math.floor(Math.random() * 10) + 1} rows ${Math.floor(Math.random() * 20) + 3}ms`,
    () => `UPDATE ${Math.floor(Math.random() * 5) + 1} rows ${Math.floor(Math.random() * 30) + 5}ms`,
    () => `DELETE ${Math.floor(Math.random() * 3) + 1} rows ${Math.floor(Math.random() * 15) + 2}ms`,
]
setInterval(() => {
    if (Math.random() < 0.3) return
    const roll = Math.random()
    if (roll < 0.8) {
        const query = queries[Math.floor(Math.random() * queries.length)]
        log(query())
    } else if (roll < 0.95) {
        const duration = Math.floor(Math.random() * 800) + 500
        log(`WARN slow query detected: ${duration}ms`)
    } else {
        log(`ERROR connection pool exhausted maxConnections=20`)
    }
}, 12000)

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'db' }));
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});
app.listen(3003, () => log('db-service on :3003'));
