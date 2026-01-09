const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /auth/google
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: "Credential is required" });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    if (!email) {
      return res.status(400).json({ error: "Email not found in token" });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await User.create({ email });
      isNewUser = true;
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      isNewUser,
      userId: user._id.toString(),
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

module.exports = { googleAuth };
