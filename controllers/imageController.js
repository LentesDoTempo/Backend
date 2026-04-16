const fs = require('fs');
const path = require('path');
const Image = require('../models/Image');
const {
  buildRevitalizationPrompt,
  generateRevitalizedImageWithStability,
} = require('../services/stabilityService');

const getImageUrl = (req, fileName) => {
  if (!fileName) {
    return null;
  }

  const host = req.get('host');
  return `${req.protocol}://${host}/uploads/${encodeURIComponent(fileName)}`;
};

const getRevitalizedImageFileName = (image) => image.generatedFileName || image.fileName;

const extractImagePayload = (req, image) => ({
  id: image.id,
  originalName: image.originalName,
  fileName: image.fileName,
  generatedFileName: image.generatedFileName,
  processedImageUrl: getImageUrl(req, image.fileName),
  restoredImageUrl: getImageUrl(req, image.fileName),
  revitalizedImageUrl: getImageUrl(req, getRevitalizedImageFileName(image)),
  mimeType: image.mimeType,
  generatedMimeType: image.generatedMimeType,
  size: image.size,
  generatedSize: image.generatedSize,
  width: image.width,
  height: image.height,
  geminiAnalysis: image.geminiAnalysis,
  status: image.status,
  createdAt: image.createdAt,
});

const uploadImage = async (req, res) => {
  try {
    const { prompt, brief, style, title } = req.body;
    const { processedImage, file } = req;
    console.log('[uploadImage] Iniciando upload:', { title, fileName: processedImage.filename });

    const analysisPrompt = buildRevitalizationPrompt({ prompt, brief, style, title });
    console.log('[uploadImage] Prompt gerado:', analysisPrompt);

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
    console.log('[uploadImage] Imagem criada no DB:', image.id);

    const sourceImageBuffer = await fs.promises.readFile(processedImage.path);
    console.log('[uploadImage] Buffer lido:', sourceImageBuffer.length, 'bytes');

    console.log('[uploadImage] Chamando Stability AI...');
    const stabilityResult = await generateRevitalizedImageWithStability({
      imageBuffer: sourceImageBuffer,
      imageName: processedImage.filename,
      mimeType: 'image/webp',
      prompt,
      brief,
      style,
      title,
    });
    console.log('[uploadImage] Resposta Stability recebida:', stabilityResult.imageBuffer.length, 'bytes');

    const generatedFileName = processedImage.filename.replace(/\.webp$/i, '-restored.png');
    const generatedFilePath = path.join(path.dirname(processedImage.path), generatedFileName);

    await fs.promises.writeFile(generatedFilePath, stabilityResult.imageBuffer);
    console.log('[uploadImage] Arquivo salvo:', generatedFilePath);

    await Image.update(
      {
        generatedFileName,
        generatedFilePath,
        generatedMimeType: stabilityResult.mimeType,
        generatedSize: stabilityResult.imageBuffer.length,
        geminiAnalysis: analysisPrompt,
        status: 'completed',
      },
      { where: { id: image.id } }
    );
    console.log('[uploadImage] DB atualizado com status completed');

    const updatedImage = await Image.findByPk(image.id);
    console.log('[uploadImage] Enviando resposta:', { id: updatedImage.id, status: updatedImage.status });

    return res.status(200).json({
      data: extractImagePayload(req, updatedImage),
    });
  } catch (error) {
    console.error('[uploadImage] ❌ ERRO:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      error: error.message || 'Failed to generate image with Stability AI',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
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
        ...extractImagePayload(req, image),
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
        'generatedFileName',
        'generatedMimeType',
        'generatedSize',
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

    const imagesWithUrl = rows.map((image) => {
      const raw = image.toJSON();
      return {
        ...extractImagePayload(req, raw),
      };
    });

    res.json({
      data: imagesWithUrl,
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

    if (image.generatedFilePath && fs.existsSync(image.generatedFilePath)) {
      await fs.promises.unlink(image.generatedFilePath);
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
