const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const Image = require('../models/Image');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeImageWithGemini = async (imagePath, prompt) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = 'image/webp';

  const result = await model.generateContent([
    prompt || 'Descreva esta imagem em detalhes.',
    {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    },
  ]);

  const response = await result.response;
  return response.text();
};

const uploadImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    const { processedImage, file } = req;

    const image = await Image.create({
      userId: req.user.id,
      originalName: file.originalName,
      fileName: processedImage.filename,
      filePath: processedImage.path,
      mimeType: 'image/webp',
      size: processedImage.size,
      width: processedImage.width,
      height: processedImage.height,
      status: 'processing',
    });

    res.status(202).json({
      message: 'Image uploaded successfully, processing started',
      data: {
        id: image.id,
        status: image.status,
      },
    });

    await Image.update({ status: 'processing' }, { where: { id: image.id } });

    try {
      const analysis = await analyzeImageWithGemini(
        processedImage.path,
        prompt
      );

      await Image.update(
        {
          geminiAnalysis: analysis,
          status: 'completed',
        },
        { where: { id: image.id } }
      );
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      await Image.update(
        { status: 'failed' },
        { where: { id: image.id } }
      );
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

const getImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findOne({
      where: { id, userId: req.user.id },
      include: [{ association: 'user', attributes: ['id', 'name', 'email'] }],
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({
      data: {
        id: image.id,
        originalName: image.originalName,
        fileName: image.fileName,
        mimeType: image.mimeType,
        size: image.size,
        width: image.width,
        height: image.height,
        geminiAnalysis: image.geminiAnalysis,
        status: image.status,
        createdAt: image.createdAt,
        user: image.user,
      },
    });
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ error: 'Failed to get image' });
  }
};

const listImages = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { userId: req.user.id };
    if (status) {
      where.status = status;
    }

    const { count, rows } = await Image.findAndCountAll({
      where,
      attributes: [
        'id',
        'originalName',
        'fileName',
        'mimeType',
        'size',
        'width',
        'height',
        'status',
        'geminiAnalysis',
        'createdAt',
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('List images error:', error);
    res.status(500).json({ error: 'Failed to list images' });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findOne({ where: { id, userId: req.user.id } });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (fs.existsSync(image.filePath)) {
      await fs.promises.unlink(image.filePath);
    }

    await image.destroy();

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

module.exports = {
  uploadImage,
  getImage,
  listImages,
  deleteImage,
};
