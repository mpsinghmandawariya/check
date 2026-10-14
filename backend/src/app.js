const express = require("express");
const cors = require("cors");
const health = require("./routes/health.routes");
const writing = require("./routes/writing.routes");
const history = require("./routes/history.routes");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

app.disable("x-powered-by");
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "100kb" }));
app.get("/", (req, res) =>
  res.json({ service: "WordWise AI API", status: "running" }),
);
app.use("/api/health", health);
app.use("/api/writing", writing);
app.use("/api/history", history);
app.use((req, res) =>
  res.status(404).json({ success: false, message: "API endpoint not found." }),
);
app.use(errorMiddleware);

module.exports = app;
