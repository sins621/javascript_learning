import express from "express";
import bodyParser from "body-parser";
// import pg from "pg";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import axios from "axios";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (_req, res) => {
  res.render("index.ejs", {});
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// let url = "https://openlibrary.org/search.json";
// let params = {
//   title: book,
//   author: author,
//   limit: 10,
//   fields: "title,author_name,cover_i",
// };

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
