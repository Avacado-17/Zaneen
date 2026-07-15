const serverApp = require("../dist/server.cjs");

module.exports = function handler(req: any, res: any) {
  const app = serverApp.default || serverApp;
  return app(req, res);
};
