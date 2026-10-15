const express = require("express");
const { db } = require("../config/database");
const { checkMLHealth } = require("../services/ml.service");
const router = express.Router();
router.get("/", async (req, res) => {
  let sqlite = "connected",
    ml = "unavailable";
  try {
    db.prepare("SELECT 1").get();
  } catch {
    sqlite = "unavailable";
  }
  try {
    await checkMLHealth();
    ml = "running";
  } catch {}
  const success = sqlite === "connected" && ml === "running";
  res
    .status(success ? 200 : 503)
    .json({
      success,
      service: "wordwise-api",
      status: "running",
      dependencies: { sqlite, pythonML: ml },
    });
});
module.exports = router;
