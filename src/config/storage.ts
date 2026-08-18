import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Local storage backup directory
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|csv|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, CSV, or Excel files are allowed'));
    }
  }
});

export const uploadToCloud = async (file: Express.Multer.File): Promise<string> => {
  // Mock cloud storage upload (returns local upload route)
  console.log(`[MOCK CLOUD STORAGE] Uploaded file ${file.filename} to Cloudinary/S3`);
  return `/uploads/${file.filename}`;
};
