import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "123456",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (_req, res) => {
  const result = await db.query("SELECT * FROM visited_countries");
  let visited_countries = [];
  result.rows.forEach((country) => {
    visited_countries.push(country.country_code);
  });
  res.render("index.ejs", {
    countries: visited_countries,
    total: visited_countries.length,
  });
});

app.post("/add", async (req, res) => {
  const country = req.body.country;
  const result = await db.query(
    "SELECT * FROM countries WHERE country_name = $1",
    [country],
  );
  const country_code_to_add = result.rows[0].country_code;
  await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [
    country_code_to_add,
  ]);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
