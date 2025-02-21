import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import pg from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import "dotenv/config";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: process.env.DB_HOST,
  database: "book_website",
  password: process.env.DB_PASS,
  port: 5432,
});
db.connect();

const categories = [
  "Fantasy",
  "Horror",
  "Historical Fiction",
  "Mystery",
  "Literary Fiction",
  "Thriller",
  "Science Fiction",
  "Philosophical",
  "Religious",
  "Drama",
  "Comedy",
  "Crime and Detective",
  "Self Help",
  "Non-fiction",
];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(morgan("tiny"));
app.use(express.static("public"));

app.get("/", async (_req, res) => {
  const book_query = await db.query("SELECT * FROM book");
  const books = book_query.rows;
  res.render("index.ejs", { categories: categories, books: books });
});

app.post("/add", async (req, res) => {
  const author = req.body.author;
  const title = req.body.title;
  const url = "https://openlibrary.org/search.json";
  const params = {
    title: title,
    author: author,
    limit: 5,
    fields: "title,author_name,cover_i, publish_year",
  };

  axios
    .get(url, { params: params })
    .then(function (response) {
      const books = response.data;
      res.render("add_book.ejs", { books: books, categories: categories });
    })
    .catch(function (error) {
      console.log(error);
      res.status(500);
    });
});

app.get("/add", async (req, res) => {
  res.render("add_book.ejs");
});

app.post("/submit", async (req, res) => {
  console.log(req.body);
  const book = JSON.parse(req.body.book);
  const title = book.title;
  const author = book.author_name[0];
  const category = req.body.category;
  const publish_year = book.publish_year[0];
  const abstract = req.body.abstract;
  const cover_id = book.cover_i;
  const quantity = req.body.quantity;
  const price = req.body.price;
  const values_to_add = [
    title,
    author,
    category,
    publish_year,
    abstract,
    cover_id,
    quantity,
    price,
  ];
  db.query(
    "INSERT INTO book (title, author, category, publish_year, abstract, cover_id, quantity, price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    values_to_add,
  );
  res.redirect("/");
});

app.get("/api/ai_abstract", async (req, res) => {
  const author = req.query.author;
  const title = req.query.title;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Provide a 20-30 word abstract for the Book ${title} by ${author}`;
  const result = await model.generateContent(prompt);
  const text = result.response.candidates[0].content.parts[0].text;
  return res.send(text);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
