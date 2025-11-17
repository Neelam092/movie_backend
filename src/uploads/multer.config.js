import multer from 'multer';
import { join } from 'path';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(process.cwd(), UPLOAD_DIR));
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    const filename = `${Date.now()}-${randomUUID()}.${ext}`;
    cb(null, filename);
  }
});

export const upload = multer({ storage });
