// Vercel serverless function - wraps the Express app
// All /api/* requests are routed here via vercel.json rewrites

const app = require('../server/index');

module.exports = app;
