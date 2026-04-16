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

  const VALID_SDXL_DIMENSIONS = [
    { w: 1024, h: 1024 },
    { w: 1152, h: 896 },
    { w: 1216, h: 832 },
    { w: 1344, h: 768 },
    { w: 1536, h: 640 },
    { w: 640, h: 1536 },
    { w: 768, h: 1344 },
    { w: 832, h: 1216 },
    { w: 896, h: 1152 },
  ];

  const originalWidth = metadata.width || 1024;
  const originalHeight = metadata.height || 1024;
  const aspectRatio = originalWidth / originalHeight;

  let targetDim = VALID_SDXL_DIMENSIONS[0];
  for (const dim of VALID_SDXL_DIMENSIONS) {
    const currentDiff = Math.abs(dim.w / dim.h - aspectRatio);
    const bestDiff = Math.abs(targetDim.w / targetDim.h - aspectRatio);
    if (currentDiff < bestDiff) {
      targetDim = dim;
    }
  }

  console.log('[processImage] Original:', originalWidth, 'x', originalHeight);
  console.log('[processImage] Target SDXL:', targetDim.w, 'x', targetDim.h);

  // Garante tamanho final EXATO permitido pelo SDXL
  const baseBuffer = await sharp(buffer)
    .rotate()
    .resize(targetDim.w, targetDim.h, {
      fit: 'cover',
      position: 'center',
      withoutEnlargement: false,
    })
    .webp({ quality: 85 })
    .toBuffer();

  const restoredBuffer = await sharp(baseBuffer)
    .normalize()
    .linear(1.06, -3)
    .modulate({
      brightness: 1.05,
      saturation: 1.08,
    })
    .sharpen()
    .webp({ quality: 88 })
    .toBuffer();

  const outputPath = path.join(uploadDir, filename);
  await fs.promises.writeFile(outputPath, restoredBuffer);

  const outputMetadata = await sharp(restoredBuffer).metadata();

  return {
    path: outputPath,
    filename,
    size: restoredBuffer.length,
    width: outputMetadata.width,
    height: outputMetadata.height,
    originalWidth,
    originalHeight,
  };
};

const generateFilename = (originalName) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const baseName = path.parse(originalName).name;
  const safeName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
  return `${timestamp}-${random}-${safeName}.webp`;
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
