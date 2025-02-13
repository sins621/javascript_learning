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

let currentUserId = 1;
let users = [];

async function checkUsers() {
  const result = await db.query("SELECT * FROM users");
  return result.rows;
}

async function checkVisited() {
  const result = await db.query(
    "SELECT * FROM visited_countries WHERE user_id = $1",
    [currentUserId],
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (_req, res) => {
  users = await checkUsers();
  let countries = await checkVisited();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: users.find((user) => user.id == currentUserId).color,
  });
});

app.post("/user", async (req, res) => {
  if (req.body.add) {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()],
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId],
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/new", async (req, res) => {
  // Hint: The RETURNING keyword can return the data that was inserted.
  // https://www.postgresql.org/docs/current/dml-returning.html
  let user_name = req.body.name;
  let color = req.body.color;

  let query = await db.query(
    "INSERT INTO users (name, color) VALUES ($1, $2) RETURNING id",
    [user_name, color],
  );
  currentUserId = query.rows[0].id;
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
