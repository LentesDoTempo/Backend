const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  },
});

const processImage = async (buffer, filename) => {
  const metadata = await sharp(buffer).metadata();

  const resizedBuffer = await sharp(buffer)
    .resize(1200, null, {
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();

  const outputPath = path.join(uploadDir, filename);
  await fs.promises.writeFile(outputPath, resizedBuffer);

  const outputMetadata = await sharp(resizedBuffer).metadata();

  return {
    path: outputPath,
    filename,
    size: resizedBuffer.length,
    width: outputMetadata.width,
    height: outputMetadata.height,
    originalWidth: metadata.width,
    originalHeight: metadata.height,
  };
};

const generateFilename = (originalName) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const safeName = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
  return `${timestamp}-${random}-${safeName}`;
};

const handleUpload = async (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds limit (5MB)' });
      }
      return res.status(400).json({ error: err.message });
    }

    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    try {
      const filename = generateFilename(req.file.originalname);
      const processed = await processImage(req.file.buffer, filename);

      req.processedImage = processed;
      req.file.originalName = req.file.originalname;
      req.file.mimeType = req.file.mimetype;

      next();
    } catch (error) {
      console.error('Image processing error:', error);
      res.status(500).json({ error: 'Failed to process image' });
    }
  });
};

module.exports = {
  handleUpload,
  uploadDir,
};
