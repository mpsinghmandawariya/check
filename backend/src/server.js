require("dotenv").config();
const app = require("./app");
const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, "0.0.0.0", () =>
  console.log(`WordWise API listening on port ${port}`),
);
function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
