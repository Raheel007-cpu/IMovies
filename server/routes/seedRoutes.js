const express = require("express");
const router = express.Router();
const { getDatabaseStats } = require("../controllers/seedController");

router.get("/status", getDatabaseStats);

module.exports = router;

