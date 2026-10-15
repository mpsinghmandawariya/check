const express = require("express");
const c = require("../controllers/history.controller");
const router = express.Router();
router.post("/", c.saveHistory);
router.get("/", c.getHistory);
router.get("/:id", c.getById);
router.delete("/:id", c.deleteHistory);
module.exports = router;
