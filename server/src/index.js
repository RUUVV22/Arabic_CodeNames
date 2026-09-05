const { createGameServer } = require('./createServer');

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || '0.0.0.0';
const server = createGameServer({ corsOrigin: process.env.CORS_ORIGIN || '*' });

server.start(port, host)
  .then(() => {
    console.log(`خادم الشفرة يعمل على http://${host}:${port}`);
  })
  .catch((error) => {
    console.error('تعذر تشغيل الخادم:', error);
    process.exitCode = 1;
  });

async function shutdown() {
  await server.stop();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
