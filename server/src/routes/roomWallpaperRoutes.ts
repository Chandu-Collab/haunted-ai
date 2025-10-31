import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Set up multer for file uploads
const uploadDir = path.join(__dirname, '../../../public/uploads/room-wallpapers');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

// POST /api/rooms/upload-wallpaper
router.post('/upload-wallpaper', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Serve the file from /uploads/room-wallpapers/...
  const url = `/uploads/room-wallpapers/${req.file.filename}`;
  res.json({ url });
});

export default router;
