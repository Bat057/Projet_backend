const express = require('express');
const router = express.Router();
const bookCtrl = require("../controllers/book")

const auth = require('../middleware/auth');
const { upload, processImage } = require('../middleware/multer-config');

router.get('/', bookCtrl.getAllBooks);
router.get('/bestrating', bookCtrl.getBestRatedBooks);
router.post('/', auth, upload, processImage, bookCtrl.createBook);
router.put('/:id', auth, upload, processImage, bookCtrl.modifyBook);
router.get('/:id', bookCtrl.getOneBook);
router.delete('/:id', auth, bookCtrl.deleteBook);

router.post('/:id/rating',auth, bookCtrl.createRating);

module.exports = router;