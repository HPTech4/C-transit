"use strict";

import multer from "multer";

// Store file in memory as a Buffer — we send it straight to Cloudinary
// without touching the local filesystem
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, and WEBP images are allowed"));
    }
    cb(null, true);
  },
});

export default upload;
