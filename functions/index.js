const functions = require("firebase-functions");
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = false;
const app = next({ dev, conf: { distDir: ".next" } });
const handle = app.getRequestHandler();

exports.ssrapp = functions.https.onRequest((req, res) => {
  const parsedUrl = parse(req.url, true);
  app.prepare().then(() => {
    handle(req, res, parsedUrl);
  });
});
