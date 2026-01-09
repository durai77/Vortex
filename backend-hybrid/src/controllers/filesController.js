const File = require("../models/File");
const User = require("../models/User");

// POST /files/send - Upload encrypted file
const sendFile = async (req, res) => {
  try {
    const {
      receiverId,
      encryptedAESKey,
      nonce,
      authTag,
      signature,
      senderPublicKey,
    } = req.body;
    const file = req.file;

    // Validate required fields
    if (
      !receiverId ||
      !encryptedAESKey ||
      !nonce ||
      !authTag ||
      !signature ||
      !senderPublicKey ||
      !file
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    // Convert file buffer to base64 for MongoDB storage
    const encryptedFileBase64 = file.buffer.toString("base64");

    // Create file record
    const newFile = await File.create({
      senderId: req.userId,
      receiverId,
      fileName: file.originalname,
      encryptedFile: encryptedFileBase64,
      encryptedAESKey,
      nonce,
      authTag,
      signature,
      senderPublicKey,
    });

    res.json({
      fileId: newFile._id.toString(),
      message: "File stored securely",
    });
  } catch (error) {
    console.error("Send file error:", error);
    res.status(500).json({ error: "Failed to send file" });
  }
};

// GET /files/inbox - List incoming files
const getInbox = async (req, res) => {
  try {
    const files = await File.find({ receiverId: req.userId })
      .select("_id fileName senderId uploadedAt")
      .populate("senderId", "email")
      .sort({ uploadedAt: -1 });

    const inbox = files.map((file) => ({
      fileId: file._id.toString(),
      fileName: file.fileName,
      senderId: file.senderId._id.toString(),
      senderEmail: file.senderId.email,
      uploadedAt: file.uploadedAt.toISOString(),
    }));

    res.json(inbox);
  } catch (error) {
    console.error("Get inbox error:", error);
    res.status(500).json({ error: "Failed to fetch inbox" });
  }
};

// GET /files/download/:fileId - Download encrypted file
const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Verify the requester is the intended receiver
    if (file.receiverId.toString() !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Mark as downloaded
    file.downloaded = true;
    await file.save();

    // Return encrypted file + crypto metadata as JSON
    res.json({
      encryptedFile: file.encryptedFile,
      encryptedAESKey: file.encryptedAESKey,
      nonce: file.nonce,
      authTag: file.authTag,
      signature: file.signature,
      senderPublicKey: file.senderPublicKey,
      fileName: file.fileName,
    });
  } catch (error) {
    console.error("Download file error:", error);
    res.status(500).json({ error: "Failed to download file" });
  }
};

module.exports = { sendFile, getInbox, downloadFile };
