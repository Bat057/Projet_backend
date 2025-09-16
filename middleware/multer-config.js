/*const multer = require('multer');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    let name = file.originalname.split(' ').join('_');
    name = name.split('.').join('_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
  }
});

module.exports = multer({storage: storage}).single('image');*/


const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage }).single('image');

const processImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const name = req.file.originalname.split(' ').join('_').split('.').slice(0, -1).join('_');
    const filename = `${name}_${Date.now()}.webp`;
    const outputPath = path.join('images', filename);

    await sharp(req.file.buffer)
      .webp({ quality: 80 })
      .toFile(outputPath);

    req.file.filename = filename;
    req.file.path = outputPath;
    req.file.mimetype = 'image/webp';

    next();
  } catch (error) {
    console.error('Erreur de traitement d’image :', error);
    res.status(500).json({ error: 'Erreur lors du traitement de l’image' });
  }
};

module.exports = {
  upload,
  processImage
};
