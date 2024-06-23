const express = require("express");
const { Op } = require("sequelize");
const Joi = require("joi");
const router = express.Router();
const Book = require("../models/book");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const bookSchema = Joi.object({
  title: Joi.string().min(1).required().messages({
    "string.min": "Title is required",
    "any.required": "Title is required",
  }),
  author: Joi.string().min(1).required().messages({
    "string.min": "Author is required",
    "any.required": "Author is required",
  }),
  publishedDate: Joi.date().required().messages({
    "date.base": "Published Date is required and should be a valid date",
    "any.required": "Published Date is required",
  }),
  pages: Joi.number().integer().min(1).required().messages({
    "number.base": "Pages should be a positive integer",
    "any.required": "Pages are required",
  }),
  genre: Joi.string().min(1).required().messages({
    "string.min": "Genre is required",
    "any.required": "Genre is required",
  }),
});

router.post("/books", authenticate, authorize("admin"), async (req, res) => {
  const { error, value } = bookSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res
      .status(400)
      .json({ errors: error.details.map((detail) => detail.message) });
  }

  try {
    const book = await Book.create(value);
    res.status(201).send(book);
  } catch (error) {
    res.status(400).send(error);
  }
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10),
  sortBy: Joi.string().default("createdAt"),
  order: Joi.string().valid("ASC", "DESC").default("ASC"),
});

router.get("/books", async (req, res) => {
  const { error, value } = paginationSchema.validate(req.query, {
    abortEarly: false,
  });

  if (error) {
    return res
      .status(400)
      .json({ errors: error.details.map((detail) => detail.message) });
  }

  try {
    const { page = 1, limit = 10, sortBy = "createdAt", order = "ASC" } = value;

    const books = await Book.findAll({
      limit: parseInt(limit, 10),
      offset: (page - 1) * limit,
      order: [[sortBy, order.toUpperCase()]],
    });

    const totalCount = await Book.count();
    const totalPages = Math.ceil(totalCount / limit);
    const pagination = {
      currentPage: parseInt(page, 10),
      totalPages,
      totalBooks: totalCount,
      booksPerPage: parseInt(limit, 10),
    };

    res.json({ books, pagination });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/books/:id", async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).send();
    }
    res.send(book);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch("/books/:id", async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).send();
    }
    await book.update(req.body);
    res.send(book);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete("/books/:id", async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).send();
    }
    await book.destroy();
    res.send(book);
  } catch (error) {
    res.status(500).send(error);
  }
});

const searchSchema = Joi.object({
  title: Joi.string().optional().allow("").trim(),
  author: Joi.string().optional().allow("").trim(),
  genre: Joi.string().optional().allow("").trim(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10),
});

router.get("/books-search", async (req, res) => {
  try {
    const { error, value } = searchSchema.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      return res
        .status(400)
        .json({ errors: error.details.map((detail) => detail.message) });
    }
    const { title, author, genre, page = 1, limit = 10 } = value;
    const where = {};

    if (title) {
      where.title = { [Op.like]: `%${title}%` };
    }
    if (author) {
      where.author = { [Op.like]: `%${author}%` };
    }
    if (genre) {
      where.genre = { [Op.like]: `%${genre}%` };
    }

    const offset = (page - 1) * limit;

    const books = await Book.findAll({
      where,
      limit: parseInt(limit, 10),
      offset,
    });

    const totalCount = await Book.count({ where });

    const totalPages = Math.ceil(totalCount / limit);

    const pagination = {
      currentPage: parseInt(page, 10),
      totalPages,
      totalBooks: totalCount,
      booksPerPage: parseInt(limit, 10),
    };

    res.json({ books, pagination });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
