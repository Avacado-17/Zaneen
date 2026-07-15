import serverApp from "../dist/server.cjs";

export default function handler(req: any, res: any) {
  const app = serverApp.default || serverApp;
  return app(req, res);
}
