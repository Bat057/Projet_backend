const Book = require("../models/book");
const fs = require('fs');

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;

  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    ratings: bookObject.ratings,
    averageRating: bookObject.averageRating
  });

  book.save().then(
    () => {
      res.status(201).json({
        message: 'Book saved successfully!'
      });
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error,
        message: "Erreur dans l'ajout du livre"
      });
    }
  );
};

exports.getAllBooks = (req, res, next) => {
  Book.find().then(
    (books) => {
      res.status(200).json(books);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé' });
      }

      res.status(200).json(book);
    })
    .catch(error => {
      res.status(400).json({ error: error });
    });
};

exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then(books => {
      res.status(200).json(books);
    })
    .catch(error => res.status(400).json({ error }));
};


exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: 'Not authorized' });
      } else {
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => { res.status(200).json({ message: 'Livre supprimé !' }) })
            .catch(error => res.status(401).json({ error }));
        });
      }
    })
    .catch(error => {
      res.status(500).json({ error });
    });
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file ? {
    ...JSON.parse(req.body.book),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete bookObject._userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: 'Not authorized' });
      }

      if (req.file) {
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, (err) => {
          if (err) console.error('Erreur lors de la suppression de l’image :', err);
        });
      }

      Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Livre modifié!' }))
        .catch(error => res.status(401).json({ error }));

    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.createRating = (req, res, next) => {
  const bookId = req.params.id;
  const { userId, rating } = req.body;
  if (!bookId || bookId === 'undefined') {
    return res.status(400).json({ error: 'Book ID is missing or invalid' });
  }

  Book.findById(bookId)
    .then(book => {
      if (!book) return res.status(404).json({ message: 'Livre non trouvé' });

      const existingRatingIndex = book.ratings.findIndex(r => r.userId === userId);
      if (existingRatingIndex !== -1) {
        console.log('error: Livre déjà noté par cet utilisateur')
        return res.status(400).json({ message: 'Livre déjà noté par cet utilisateur' });
      }

      book.ratings.push({ userId, grade: rating });

      const totalGrades = book.ratings.reduce((sum, r) => sum + r.grade, 0);
      book.averageRating = totalGrades / book.ratings.length;
      book.averageRating = Math.round(book.averageRating * 10) / 10;

      return book.save().then(
        () => {
          res.status(200).json(book);
        }
      ).catch(
        (error) => {
          res.status(400).json({
            error: error
          });
        }


      )
    })

    .catch(error => res.status(500).json({ error }));
};





