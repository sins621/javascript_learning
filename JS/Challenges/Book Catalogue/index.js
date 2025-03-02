import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import pg from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import "dotenv/config";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";

const APP = express();
APP.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }),
);
APP.use(bodyParser.urlencoded({ extended: true }));
APP.use(express.static("public"));
APP.use(morgan("tiny"));
APP.use(express.static("public"));
APP.use(passport.initialize());
APP.use(passport.session());

const PORT = 6199;

const DB = new pg.Client({
  user: "postgres",
  host: process.env.DB_HOST,
  database: "book_website",
  password: process.env.DB_PASS,
  port: 5432,
});

DB.connect();

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
let user = null;

APP.locals.url_for = function (route, params = {}) {
  const QUERY_STRING = new URLSearchParams(params).toString();
  return QUERY_STRING ? `${route}?${QUERY_STRING}` : route;
};

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

// Home
APP.get("/", async (req, res) => {
  if (req.isAuthenticated()) {
    user = req.user;
  }

  const BOOK_QUERY = await DB.query("SELECT * FROM book");
  const BOOKS = BOOK_QUERY.rows;
  return res.render("index.ejs", {
    categories: CATEGORIES,
    books: BOOKS,
    user: user,
  });
});

APP.get("/filter", async (req, res) => {
  if (req.isAuthenticated()) {
    user = req.user;
  }
  const BOOK_QUERY = await DB.query("SELECT * FROM book where category=$1", [
    req.query.category,
  ]);
  const BOOKS = BOOK_QUERY.rows;
  return res.render("index.ejs", {
    categories: CATEGORIES,
    books: BOOKS,
    user: user,
  });
});

APP.post("/add", async (req, res) => {
  const URL = "https://openlibrary.org/search.json";
  const PARAMS = {
    author: req.body.author,
    title: req.body.title,
    limit: 5,
    fields: "title,author_name,cover_i, publish_year",
  };

  try {
    const BOOK_DATA = await axios.get(URL, { params: PARAMS });
    const BOOKS = BOOK_DATA.data;

    return res.render("add_book.ejs", { books: BOOKS, categories: CATEGORIES });
  } catch (error) {
    console.log(error);

    return res.status(500);
  }
});

APP.get("/add", async (req, res) => {
  if (req.isAuthenticated() === false) return res.render("login.ejs");

  if (req.user.role != "admin") return res.redirect("/");

  return res.render("add_book.ejs");
});

APP.post("/submit", async (req, res) => {
  const BOOK = JSON.parse(req.body.book);
  try {
    await DB.query(
      `INSERT INTO book (
       title,
       author,
       category,
       publish_year,
       abstract,
       cover_id,
       quantity,
       price
       )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        BOOK.title,
        BOOK.author_name[0],
        req.body.category,
        BOOK.publish_year[0],
        req.body.abstract,
        BOOK.cover_i,
        req.body.quantity,
        req.body.price,
      ],
    );
  } catch (err) {
    console.log(`Server Error: ${err}`);
  }

  return res.redirect("/");
});

APP.get("/book_focus", async (req, res) => {
  if (req.isAuthenticated()) user = req.user;

  const BOOK_ID = req.query.book_id;
  const BOOK_QUERY = await DB.query("SELECT * FROM book WHERE id = $1", [
    BOOK_ID,
  ]);
  const BOOK = BOOK_QUERY.rows[0];
  const REVIEW_QUERY = await DB.query(
    `SELECT * FROM book_review
     WHERE book_id = $1`,
    [BOOK_ID],
  );
  const REVIEWS = REVIEW_QUERY.rows;
  return res.render("book_focus.ejs", {
    book: BOOK,
    user: user,
    reviews: REVIEWS,
  });
});

APP.post("/add_review", async (req, res) => {
  try {
    var USER_QUERY = await DB.query(
      `SELECT * FROM users
     WHERE email = $1`,
      [req.user.email],
    );
  } catch (err) {
    console.log(err);
  }

  try {
    await DB.query(
      `INSERT INTO book_review (
       review_title,
       reviewer_name,
       review_date,
       review_text,
       user_id,
       review_rating,
       book_id
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.body.title,
        USER_QUERY.rows[0].name,
        today(),
        req.body.review,
        USER_QUERY.rows[0].id,
        req.body.rating,
        req.body.book_id,
      ],
    );
  } catch (err) {
    console.log(`DB Error ${err}`);
  }

  res.redirect(`/book_focus?book_id=${req.body.book_id}`);
});



APP.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    user = null;
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
  }),
);

APP.get("/register", (_req, res) => {
  res.render("register.ejs");
});

APP.post("/register", async (req, res) => {
  const EMAIL = req.body.username;
  const PASSWORD = req.body.password;

  const CHECK_RESULT = await DB.query(
    `SELECT * FROM users
     WHERE email = $1`,
    [EMAIL],
  );
  if (CHECK_RESULT.rows.length > 0) return req.redirect("/login");

  try {
    const HASH = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
    const NEW_USER_QUERY = await DB.query(
      `INSERT INTO users (email, password)
       VALUES ($1, $2) RETURNING *`,
      [EMAIL, HASH],
    );

    const NEW_USER = NEW_USER_QUERY.rows[0];
    const USER_ROLE_ID = 2;
    const USER_ROLE_NAME = "user";

    const USER_QUERY = await DB.query(
      `INSERT INTO user_roles (user_id, role_id, email, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [NEW_USER.id, USER_ROLE_ID, EMAIL, USER_ROLE_NAME],
    );

    const USER = USER_QUERY.rows[0];

    req.login(USER, (_err) => {
      console.log("success");
      return res.redirect("/");
    });
  } catch (err) {
    console.error("Error hashing password:", err);
  }
});

passport.use(
  "local",
  new Strategy(async function verify(username, password, callback) {
    const RESULT = await DB.query("SELECT * FROM users WHERE email = $1 ", [
      username,
    ]);

    if (RESULT.rows.length === 0) return callback("User not found");

    const USER = RESULT.rows[0];
    const STORED_HASHED_PASSWORD = USER.password;

    try {
      const VALID = bcrypt.compare(password, STORED_HASHED_PASSWORD);

      if (!VALID) return callback(null, false);

      const USER_QUERY = await DB.query(
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
        [USER.id],
      );

      return callback(null, USER_QUERY.rows[0]);
    } catch (err) {
      console.error("Error comparing passwords:", err);

      return callback(err);
    }
  }),
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
