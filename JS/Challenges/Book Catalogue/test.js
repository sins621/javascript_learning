import "dotenv/config";
import DatabaseHandler from "./models/databasehandler.js";

const CLIENT_INFO = {
  user: "postgres",
  host: process.env.DB_HOST,
  database: "book_website",
  password: process.env.DB_PASS,
  port: 5432,
};

const databaseHandler = new DatabaseHandler(CLIENT_INFO);

console.log(await databaseHandler.fetchBooksBy("id", 1));