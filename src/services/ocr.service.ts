"use strict";

import Tesseract from "tesseract.js";
import sharp from "sharp";
import logger from "../config/logger.js";

export interface ParsedIdCard {
  studentName: string | null;
  studentId: string | null;
  matricNumber: string | null;
  school: string | null;
  department: string | null;
}

const preprocessImage = async (imageBuffer: Buffer): Promise<Buffer> => {
  logger.info("ocr.preprocessing_image");

  const processed = await sharp(imageBuffer)
    .resize({
      width: 1200,
      withoutEnlargement: true,
    })
    .greyscale()
    .normalize()
    .linear(1.4, -30)
    .sharpen({ sigma: 1.5 })
    .png()
    .toBuffer();

  logger.info("ocr.preprocessing_complete");
  return processed;
};

const bufferToBase64 = (buffer: Buffer): string => {
  return `data:image/png;base64,${buffer.toString("base64")}`;
};

const extractTextFromImage = async (imageBuffer: Buffer): Promise<string> => {
  const cleanBuffer = await preprocessImage(imageBuffer);
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

  logger.info({ confidence }, "ocr.extraction_complete");

  if (confidence < 60) {
    logger.warn(
      { confidence },
      "ocr.low_confidence — extracted text may be inaccurate"
    );
  }

  return text;
};

const cleanLine = (line: string): string => {
  return line
    .replace(/[|{}[\]\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const parseIdCardText = (rawText: string): ParsedIdCard => {
  const lines = rawText
    .split("\n")
    .map(cleanLine)
    .filter((line) => line.length > 2);

  logger.info({ lines }, "ocr.parsed_lines");

  const extractMatricNumber = (): string | null => {
    const match = rawText.match(/(\d{4}\/\d\/\d{4,6}\s*[A-Z]{2,3})/i);
    if (!match) return null;
    return match[1].replace(/\s+/g, "").toUpperCase();
  };

  const extractStudentId = (): string | null => {
    const match = rawText.match(
      /STUDENT\s+IDENTITY\s+CAR\w?\s+([A-Z]\d{6,8})/i
    );
    return match ? match[1].toUpperCase() : null;
  };

  const extractStudentName = (): string | null => {
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

  const extractSchool = (): string | null => {
    const schoolLine = rawText.split("\n").find((line) => /school/i.test(line));
    if (!schoolLine) return null;
    const match = schoolLine.match(/School[:\s]+([A-Z]{2,10})/i);
    if (!match) return null;
    return match[1].split(/\s+/)[0].toUpperCase().trim();
  };

  const extractDepartment = (): string | null => {
    const deptLine = rawText
      .split("\n")
      .find((line) => /department/i.test(line));
    if (!deptLine) return null;
    const match = deptLine.match(/Department[:\s]+([A-Z]{2,10})/i);
    if (!match) return null;
    return match[1].split(/\s+/)[0].toUpperCase().trim();
  };

  const parsed: ParsedIdCard = {
    studentName: extractStudentName(),
    studentId: extractStudentId(),
    matricNumber: extractMatricNumber(),
    school: extractSchool(),
    department: extractDepartment(),
  };

  logger.info({ parsed }, "ocr.fields_parsed");
  return parsed;
};

export { preprocessImage, extractTextFromImage, parseIdCardText };
