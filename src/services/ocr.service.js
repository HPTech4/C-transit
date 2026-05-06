"use strict";

import Tesseract from "tesseract.js";
import sharp from "sharp";
import logger from "../config/logger.js";

/**
 * Preprocesses an image buffer using sharp to improve OCR accuracy.
 * Handles dark photos, glare from plastic card sleeves, and low contrast.
 *
 * @param {Buffer} imageBuffer - Raw image buffer from multer
 * @returns {Promise<Buffer>} Processed image buffer ready for OCR
 */
const preprocessImage = async (imageBuffer) => {
  logger.info("ocr.preprocessing_image");

  const processed = await sharp(imageBuffer)
    // ── Step 1: Resize ──────────────────────────────────
    // Resize to a consistent width — too large slows OCR,
    // too small loses text detail. 1200px is the sweet spot.
    .resize({
      width: 1200,
      withoutEnlargement: true, // Don't upscale small images — causes blur
    })

    // ── Step 2: Greyscale ───────────────────────────────
    // Remove color — Tesseract reads black/white text better.
    // Color noise from plastic sleeves and backgrounds is eliminated.
    .greyscale()

    // ── Step 3: Normalize ───────────────────────────────
    // Stretches the brightness range to use the full 0-255 scale.
    // Fixes both dark (underexposed) and washed-out (overexposed) photos.
    .normalize()

    // ── Step 4: Linear brightness/contrast adjustment ───
    // multiply > 1 increases contrast, offset adjusts brightness.
    // These values are tuned for dark phone photos of ID cards.
    .linear(1.4, -30)

    // ── Step 5: Sharpen ─────────────────────────────────
    // Sharpens letter edges — critical for small text on ID cards.
    // sigma controls the sharpening radius.
    .sharpen({ sigma: 1.5 })

    // ── Step 6: Output as PNG ───────────────────────────
    // PNG is lossless — no compression artifacts that confuse OCR.
    // JPEG compression can blur letter edges.
    .png()

    .toBuffer();

  logger.info("ocr.preprocessing_complete");
  return processed;
};

/**
 * Converts a processed image buffer to a base64 data URL.
 * Tesseract can read base64 directly — no need to write to disk.
 * @param {Buffer} buffer
 * @returns {string} base64 data URL
 */
const bufferToBase64 = (buffer) => {
  return `data:image/png;base64,${buffer.toString("base64")}`;
};

/**
 * Runs OCR on a preprocessed image buffer.
 * Accepts a buffer directly — image never touches the filesystem.
 *
 * @param {Buffer} imageBuffer - Raw image buffer from multer
 * @returns {Promise<string>} Raw text extracted from image
 */
const extractTextFromImage = async (imageBuffer) => {
  // Preprocess first — sharp cleans the image before Tesseract reads it
  const cleanBuffer = await preprocessImage(imageBuffer);

  // Convert to base64 so Tesseract can read it without a file path
  const base64Image = bufferToBase64(cleanBuffer);

  logger.info("ocr.running_tesseract");

  const {
    data: { text, confidence },
  } = await Tesseract.recognize(base64Image, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text") {
        logger.info({ progress: Math.round(m.progress * 100) }, "ocr.progress");
      }
    },
  });

  // Log confidence score — below 60 means the image was too poor
  logger.info({ confidence }, "ocr.extraction_complete");

  if (confidence < 60) {
    logger.warn(
      { confidence },
      "ocr.low_confidence — extracted text may be inaccurate"
    );
  }

  return text;
};

/**
 * Cleans a raw OCR line — removes noise characters Tesseract
 * commonly introduces on low-light or plastic-covered cards.
 * @param {string} line
 * @returns {string}
 */
const cleanLine = (line) => {
  return line
    .replace(/[|{}[\]\\]/g, "") // Remove bracket/pipe noise
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
};

/**
 * Parses raw OCR text into structured KYC fields.
 * Tuned to FUTMinna ID card layout with tolerance for
 * common Tesseract misreads on phone-photographed cards.
 * @param {string} rawText
 * @returns {object}
 */
const parseIdCardText = (rawText) => {
  const lines = rawText
    .split("\n")
    .map(cleanLine)
    .filter((line) => line.length > 2);

  logger.info({ lines }, "ocr.parsed_lines");

  // ── 1. Matric Number ───────────────────────────────────
  const extractMatricNumber = () => {
    const match = rawText.match(/(\d{4}\/\d\/\d{4,6}\s*[A-Z]{2,3})/i);
    if (!match) return null;
    return match[1].replace(/\s+/g, "").toUpperCase();
  };

  // ── 2. Student ID ──────────────────────────────────────
  const extractStudentId = () => {
    const match = rawText.match(
      /STUDENT\s+IDENTITY\s+CAR\w?\s+([A-Z]\d{6,8})/i
    );
    return match ? match[1].toUpperCase() : null;
  };

  // ── 3. Student Name ────────────────────────────────────
  const extractStudentName = () => {
    const matricLineIndex = lines.findIndex((line) =>
      /matric\s*no/i.test(line)
    );
    if (matricLineIndex > 0) {
      const nameLine = lines[matricLineIndex - 1];
      if (/^[A-Za-z\s]+$/.test(nameLine) && nameLine.split(" ").length >= 2) {
        return nameLine.trim();
      }
    }
    const nameMatch = rawText.match(
      /([A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+)/
    );
    return nameMatch ? nameMatch[1].trim() : null;
  };

  // ── 4. School ──────────────────────────────────────────
  // Find the school line first — avoids regex flag conflicts on full text
  const extractSchool = () => {
    const schoolLine = rawText.split("\n").find((line) => /school/i.test(line));
    if (!schoolLine) return null;
    const match = schoolLine.match(/School[:\s]+([A-Z]{2,10})/i);
    if (!match) return null;
    return match[1].split(/\s+/)[0].toUpperCase().trim();
  };

  // ── 5. Department ──────────────────────────────────────
  // Find the department line first — same reason as school
  const extractDepartment = () => {
    const deptLine = rawText
      .split("\n")
      .find((line) => /department/i.test(line));
    if (!deptLine) return null;
    const match = deptLine.match(/Department[:\s]+([A-Z]{2,10})/i);
    if (!match) return null;
    return match[1].split(/\s+/)[0].toUpperCase().trim();
  };

  const parsed = {
    studentName: extractStudentName(),
    studentId: extractStudentId(),
    matricNumber: extractMatricNumber(),
    school: extractSchool(),
    department: extractDepartment(),
    rawText,
  };

  logger.info({ parsed }, "ocr.fields_parsed");
  return parsed;
};

export { preprocessImage, extractTextFromImage, parseIdCardText };
