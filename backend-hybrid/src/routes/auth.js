const express = require("express");
const router = express.Router();
const { googleAuth } = require("../controllers/authController");

// POST /auth/google
router.post("/google", googleAuth);

module.exports = router;
