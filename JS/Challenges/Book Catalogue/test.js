import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
// import pg from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(morgan("tiny"));

app.get("/", async (_req, res) => {
  res.render("index.ejs", {});
});

app.post("/add", async (req, res) => {
  let author = req.body.author;
  let title = req.body.title;
  console.log(`Author: ${author}, Title ${title}`);
  let url = "https://openlibrary.org/search.json";
  let params = {
    title: title,
    author: author,
    limit: 5,
    fields: "title,author_name,cover_i, publish_year",
  };

  axios
    .get(url, { params: params })
    .then(function (response) {
      let books = response.data;
      res.render("add_book.ejs", { books: books });
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
  res.redirect("/add");
});

app.get("/api/ai_abstract", async (req, res) => {
  const author = req.query.author;
  const title = req.query.title;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Provide a 50-100 word abstract for the Book ${title} by ${author}`;
  const result = await model.generateContent(prompt);
  const text = result.response.candidates[0].content.parts[0].text;
  return res.send(text);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// axios
//   .get(url, {
//     params: params,
//   })
//   .then(function (response) {
//     console.log(response.data);
//   })
//   .catch(function (error) {});

// const app = express();
// const port = 3000;

// const db = new pg.Client({
//   user: "postgres",
//   host: "sins@pop-os",
//   database: "books",
//   password: "123456",
//   port: 5432,
// });

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// const prompt =
//   "Provide a 50-100 word abstract for the Book Lord of The Rings by R R Tolkein";

// const result = await model.generateContent(prompt);
// console.log(result.response.text());

// db.connect();
// db.query("SELECT * FROM users");

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static("public"));
