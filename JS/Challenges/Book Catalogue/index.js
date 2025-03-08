import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import DatabaseHandler from "./models/databasehandler.js";

// TODO: Error Handling
// TODO: Continue Migration of db Functions to db Class.
// FIX: HTML Characters Ending Up in Cart Names

const APP = express();
APP.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
APP.use(bodyParser.urlencoded({ extended: true }));
APP.use(bodyParser.json());
APP.use(express.static("public"));
APP.use(morgan("tiny"));
APP.use(passport.initialize());
APP.use(passport.session());

const PORT = 6199;

const CLIENT_INFO = {
  user: "postgres",
  host: process.env.DB_HOST,
  database: "book_website",
  password: process.env.DB_PASS,
  port: 5432,
};

const databaseHandler = new DatabaseHandler(CLIENT_INFO);

const CATEGORIES = [
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

const SALT_ROUNDS = 10;

// Home
APP.get("/", async (req, res) => {
  var books = await databaseHandler.fetchAllBooks();

  if (books.length === 0) return res.send("Error Retrieving Books").status(500);

  return res.render("index.ejs", {
    categories: CATEGORIES,
    books: books,
    user: req.user,
  });
});

APP.get("/filter", async (req, res) => {
  var books = databaseHandler.fetchAllBooks({ category: req.query.category });

  if (books.length === 0) return res.send("Error Retrieving Books").status(500);

  return res.render("index.ejs", {
    categories: CATEGORIES,
    books: books,
    user: req.user,
  });
});

APP.get("/add_book", async (req, res) => {
  if (req.isAuthenticated() === false) return res.render("login.ejs");

  if (req.user.role != "admin") return res.redirect("/");

  return res.render("add_book.ejs");
});

APP.post("/add_book", async (req, res) => {
  if (!req.body) return res.send("Server Error").status(500);

  const URL = "https://openlibrary.org/search.json";
  const PARAMS = new URLSearchParams({
    author: req.body.author,
    title: req.body.title,
    limit: 5,
    fields: "title,author_name,cover_i, publish_year",
  }).toString();
  const BOOK_DATA = await fetch(`${URL}?${PARAMS}`);
  const BOOKS = await BOOK_DATA.json();

  return res.render("add_book.ejs", { books: BOOKS, categories: CATEGORIES });
});

APP.post("/submit", async (req, res) => {
  if (!req.body) return res.send("Server Error").status(500);

  const BOOK = JSON.parse(req.body.book);
  databaseHandler.addBook([
    BOOK.title,
    BOOK.author_name[0],
    req.body.category,
    BOOK.publish_year[0],
    req.body.abstract,
    BOOK.cover_i,
    req.body.quantity,
    req.body.price,
  ]);

  return res.redirect("/");
});

APP.get("/book_focus", async (req, res) => {
  if (!req.query) return res.send("Server Error").status(500);

  const BOOK_ID = req.query.book_id;
  var book = (await databaseHandler.fetchBooksBy("id", BOOK_ID))[0];

  if (!book) return res.send("Error Retrieving Book").status(500);

  var reviews = await databaseHandler.fetchBookReviews(book.id);

  return res.render("book_focus.ejs", {
    book: book,
    user: req.user,
    reviews: reviews,
  });
});

APP.post("/add_review", async (req, res) => {
  if (!req.user || !req.body) return res.send("Server Error").status(500);

  if (user.rows.length === 0)
    return res.send("Error retrieving Profile").status(500);

  const REVIEW_INFO = [
    req.body.title,
    req.user.name,
    today(),
    req.body.review,
    req.user.id,
    req.body.rating,
    req.body.book_id,
  ];
  await databaseHandler.addBookReview(REVIEW_INFO);

  res.redirect(`/book_focus?book_id=${req.body.book_id}`);
});

function today() {
  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1;
  let yyyy = today.getFullYear();

  if (dd < 10) {
    dd = "0" + dd;
  }

  if (mm < 10) {
    mm = "0" + mm;
  }

  return yyyy + "-" + mm + "-" + dd;
}

APP.get("/cart", async (req, res) => {
  if (req.isAuthenticated() === false) return res.render("login.ejs");

  var cartItems = databaseHandler.fetchCartItems(req.user.id);

  return res.render("cart.ejs", { user: req.user, cart: cartItems });
});

APP.post("/add_cart", async (req, res) => {
  /* NOTE: This creates a dependancy on the books table. When the price and amount
           of books remaining in the books table is updated, so will this table
           need to be updated. */

  

  return res
    .status(200)
    .json({ redirect_url: `/book_focus?book_id=${req.body.book_id}` });
});

APP.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return next(err);

    return res.redirect("/");
  });
});

APP.get("/login", (_req, res) => {
  res.render("login.ejs");
});

APP.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

APP.get("/register", (_req, res) => {
  res.render("register.ejs");
});

APP.post("/register", async (req, res) => {
  if (!req.body) return res.send("Server Error").status(500);

  const EMAIL = req.body.username;
  const PASSWORD = req.body.password;
  const NAME = req.body.name;
  var checkResult = await databaseHandler.database.query(
    `SELECT * FROM users
     WHERE email = $1`,
    [EMAIL]
  );

  if (checkResult.rows.length > 0) return req.redirect("/login");

  const HASH = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
  var newUserQuery = await databaseHandler.database.query(
    `INSERT INTO users (email, password, name)
       VALUES ($1, $2, $3) RETURNING *`,
    [EMAIL, HASH, NAME]
  );

  if (newUserQuery.rows.lengh === 0)
    res.send("Catastrophic Server Failure").status(500);

  const NEW_USER = newUserQuery.rows[0];
  const USER_ROLE_ID = 2;
  const USER_ROLE_NAME = "user";
  var userQuery = await databaseHandler.database.query(
    `INSERT INTO user_roles (user_id, role_id, email, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
    [NEW_USER.id, USER_ROLE_ID, EMAIL, USER_ROLE_NAME]
  );

  if (userQuery.rows.length === 0) res.send("Unexpected Failure").status(500);

  const USER = userQuery.rows[0];
  req.login(USER, (_err) => {
    console.log("success");

    return res.redirect("/");
  });
});

passport.use(
  "local",
  new Strategy(async function verify(username, password, callback) {
    var result = await databaseHandler.database.query(
      "SELECT * FROM users WHERE email = $1 ",
      [username]
    );

    if (result.rows.length === 0) return callback("User not found");

    const USER = result.rows[0];
    const STORED_HASHED_PASSWORD = USER.password;
    const VALID = await bcrypt.compare(password, STORED_HASHED_PASSWORD);

    if (!VALID) return callback(null, false);

    var userQuery = await databaseHandler.database.query(
      `SELECT email, role,
             CASE
               WHEN role = 'admin' THEN 'admin'
               WHEN role = 'user' THEN 'user'
               ELSE 'other'
             END AS role
           FROM user_roles
           WHERE user_id = $1
             ORDER BY CASE
               WHEN role = 'admin' THEN 1
               WHEN role = 'user' THEN 2
               ELSE 3
             END
           LIMIT 1;`,
      [USER.id]
    );
    const USER_DATA = {
      id: USER.id,
      email: userQuery.rows[0].email,
      role: userQuery.rows[0].role,
      cart: await databaseHandler.fetchCartItems(USER.id),
    };

    return callback(null, USER_DATA);
  })
);

passport.serializeUser((user, callback) => {
  callback(null, user);
});
passport.deserializeUser((user, callback) => {
  callback(null, user);
});

APP.get("/api/ai_abstract", async (req, res) => {
  const AUTHOR = req.query.author;
  const TITLE = req.query.title;
  const GEN_AI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
  const MODEL = GEN_AI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const PROMPT = `Provide a 20-30 word abstract for the Book ${TITLE} by ${AUTHOR}`;
  const RESULT = await MODEL.generateContent(PROMPT);
  const TEXT = RESULT.response.candidates[0].content.parts[0].text;

  return res.send(TEXT);
});

APP.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

APP.locals.url_for = function (route, params = {}) {
  const QUERY_STRING = new URLSearchParams(params).toString();

  return QUERY_STRING ? `${route}?${QUERY_STRING}` : route;
};