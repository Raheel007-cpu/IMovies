const express = require("express");
const router = express.Router();
const { getHealthStatus, pingServer } = require("../controllers/healthController");

router.get("/", getHealthStatus);
router.get("/ping", pingServer);

module.exports = router;

