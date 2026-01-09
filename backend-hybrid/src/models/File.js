const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  // Encrypted file stored directly in MongoDB as base64 string
  encryptedFile: {
    type: String,
    required: true,
  },
  encryptedAESKey: {
    type: String,
    required: true,
  },
  nonce: {
    type: String,
    required: true,
  },
  authTag: {
    type: String,
    required: true,
  },
  signature: {
    type: String,
    required: true,
  },
  senderPublicKey: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  downloaded: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("File", fileSchema);
