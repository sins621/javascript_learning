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

  const CART_ITEMS = await databaseHandler.fetchCartItems(req.user.id);

  return res.render("cart.ejs", { user: req.user, cart: CART_ITEMS });
});

APP.get("/add_cart", async (req, res) => {
  await databaseHandler.addBookToCart(req.query.book_id, req.user.id);

  return res.redirect(`/book_focus?book_id=${req.query.book_id}`);
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

  req.login(USER, (_err) => {
    console.log("success");

    return res.redirect("/");
  });
});

//Login Strategy
passport.use(
  "local",
  new Strategy(async function verify(username, password, callback) {
    // Form has to be called username even though it takes email (I think)
    const REGISTERED_USERS = await databaseHandler.fetchUsersBy(
      "email",
      username
    );

    if (REGISTERED_USERS.length === 0) return callback("User not found");

    const USER = REGISTERED_USERS[0];
    const STORED_HASHED_PASSWORD = USER.password;
    const VALID = await bcrypt.compare(password, STORED_HASHED_PASSWORD);

    if (!VALID) return callback(null, false);

    const USER_EMAIL_AND_ROLE = databaseHandler.fetchUserByHighestRole(USER.id);

    return callback(null, {
      id: USER.id,
      email: USER_EMAIL_AND_ROLE.email,
      role: USER_EMAIL_AND_ROLE.role,
      cart: await databaseHandler.fetchCartItems(USER.id),
    });
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
