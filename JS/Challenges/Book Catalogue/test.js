import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function readLineAsync(message) {
  return new Promise((resolve, reject) => {
    rl.question(message, (answer) => {
      resolve(answer);
    });
  });
}

// Leverages Node.js' awesome async/await functionality
async function demoSynchronousPrompt() {
  var promptInput = await readLineAsync("Give me some input >");
  console.log("Won't be executed until promptInput is received", promptInput);
  rl.close();
}

demoSynchronousPrompt();

// const app = express();
// const port = 3000;

// const db = new pg.Client({
//   user: "postgres",
//   host: "localhost",
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

// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });
