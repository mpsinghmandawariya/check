const express = require("express");
const { analyzeWriting } = require("../controllers/writing.controller");
const router = express.Router();
router.post("/analyze", analyzeWriting);
module.exports = router;
