import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import pg from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";

// TODO: Improve DB Query Error Logging Messages

const APP = express();
APP.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }),
);
APP.use(bodyParser.urlencoded({ extended: true }));
APP.use(bodyParser.json());
APP.use(express.static("public"));
APP.use(morgan("tiny"));
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
  console.log(req.user);
  if (req.isAuthenticated()) {
    var user = req.user;
  } else {
    var user = null;
  }

  try {
    var bookQuery = await DB.query("SELECT * FROM books");
  } catch (err) {
    console.log(`DB Error: ${err}`);
  }

  if (bookQuery.rows.length === 0)
    return res.send("Error Retrieving Books").status(500);

  const BOOKS = bookQuery.rows;

  return res.render("index.ejs", {
    categories: CATEGORIES,
    books: BOOKS,
    user: user,
  });
});

APP.get("/filter", async (req, res) => {
  if (req.isAuthenticated()) {
    var user = req.user;
  } else {
    var user = null;
  }

  try {
    var bookQuery = await DB.query(
      `SELECT * FROM books
       WHERE category=$1`,
      [req.query.category],
    );
  } catch (err) {
    console.log(`DB Error: ${err}`);
  }

  if (bookQuery.rows.length === 0)
    return res.send("Error Retrieving Books").status(500);

  const BOOKS = bookQuery.rows;

  return res.render("index.ejs", {
    categories: CATEGORIES,
    books: BOOKS,
    user: user,
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

  try {
    const BOOK_DATA = await fetch(`${URL}?${PARAMS}`);
    const BOOKS = await BOOK_DATA.json();

    return res.render("add_book.ejs", { books: BOOKS, categories: CATEGORIES });
  } catch (error) {
    console.log(error);

    return res.status(500);
  }
});

APP.post("/submit", async (req, res) => {
  if (!req.body) return res.send("Server Error").status(500);

  const BOOK = JSON.parse(req.body.book);
  try {
    await DB.query(
      `INSERT INTO books (
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
  if (!req.query) return res.send("Server Error").status(500);

  if (req.isAuthenticated()) {
    var user = req.user;
  } else {
    var user = null;
  }

  const BOOK_ID = req.query.book_id;
  try {
    var bookQuery = await DB.query("SELECT * FROM books WHERE id = $1", [
      BOOK_ID,
    ]);
  } catch (err) {
    console.log(`DB Error ${err}`);
  }

  if (bookQuery.rows.length === 0)
    return res.send("Error Retrieving Book").status(500);

  const BOOK = bookQuery.rows[0];
  try {
    var reviewQuery = await DB.query(
      `SELECT * FROM book_reviews
     WHERE book_id = $1`,
      [BOOK_ID],
    );
  } catch (err) {
    console.log(`DB Error ${err}`);
  }

  // Finding no reviews won't result in an error, none will be displayed.
  const REVIEWS = reviewQuery.rows;

  return res.render("book_focus.ejs", {
    book: BOOK,
    user: user,
    reviews: REVIEWS,
  });
});

APP.post("/add_review", async (req, res) => {
  if (!req.user || !req.body) return res.send("Server Error").status(500);

  try {
    var userQuery = await DB.query(
      `SELECT * FROM users
     WHERE email = $1`,
      [req.user.email],
    );
  } catch (err) {
    console.log(err);
  }

  if (userQuery.rows.length === 0)
    return res.send("Error retrieving Profile").status(500);

  try {
    await DB.query(
      `INSERT INTO book_reviews (
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
        userQuery.rows[0].name,
        today(),
        req.body.review,
        userQuery.rows[0].id,
        req.body.rating,
        req.body.book_id,
      ],
    );
  } catch (err) {
    console.log(`DB Error ${err}`);
  }

  res.redirect(`/book_focus?book_id=${req.body.book_id}`);
});

APP.get("/cart", async (req, res) => {
  if (req.isAuthenticated() === false) return res.render("login.ejs");

  try {
    var cartItems = await getCart(req.user.id)
  } catch (err) {
    return res.send(`Error Retrieving Cart ${err}`).status(500);
  }

  return res.render("cart.ejs", { user: req.user, cart: cartItems });
});

async function getCart(user_id){
  const CART_QUERY = await DB.query(
    `SELECT * FROM carts
     WHERE user_id = $1`,
    [user_id],
  );

  return CART_QUERY.rows;
}

APP.post("/add_cart", async (req, res) => {
  try {
    const USER_QUERY = await DB.query(
      `SELECT * FROM users
     WHERE email = $1`,
      [req.body.user_email],
    );
    var userId = USER_QUERY.rows[0].id;
  } catch (err) {
    return res.send(`User Query Error: ${err}`).status(500);
  }

  /* NOTE: This creates a dependancy on the books table. When the price and amount
           of books remaining in the books table is updated, so will this table
           need to be updated. */
  try {
    var bookQuery = await DB.query(
      `SELECT * FROM public.carts
       WHERE
         book_id = $1
       AND
         user_id = $2`,
      [req.body.book_id, userId],
    );
    console.log(bookQuery.rows);
  } catch (err) {
    console.log(`DB Error: ${err}`);
  }

  if (bookQuery.rows.length > 0) {
    try {
      await DB.query(
        `UPDATE public.carts
         SET
           amount = $1
         WHERE
           book_id = $2
         AND
           user_id = $3`,
        [bookQuery.rows[0].amount + 1, req.body.book_id, userId],
      );
    } catch {
      return res.send(`Error Adding Item to Cart: ${err}`).status(500);
    }
    return res
      .status(200)
      .json({ redirect_url: `/book_focus?book_id=${req.body.book_id}` });
  }

  try {
    await DB.query(
      `INSERT INTO public.carts
     (
       book_id,
       user_id,
       book_title,
       book_price,
       book_remaining,
       amount
     )
     VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.body.book_id,
        userId,
        req.body.book_title,
        req.body.book_price,
        req.body.book_remaining,
        1,
      ],
    );
  } catch (err) {
    return res.send(`Error Adding Item to Cart: ${err}`).status(500);
  }
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
  }),
);

APP.get("/register", (_req, res) => {
  res.render("register.ejs");
});

APP.post("/register", async (req, res) => {
  if (!req.body) return res.send("Server Error").status(500);

  const EMAIL = req.body.username;
  const PASSWORD = req.body.password;
  const NAME = req.body.name;

  try {
    var checkResult = await DB.query(
      `SELECT * FROM users
     WHERE email = $1`,
      [EMAIL],
    );
  } catch (err) {
    console.log(`DB Error ${err}`);
  }

  if (checkResult.rows.length > 0) return req.redirect("/login");

  try {
    const HASH = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
    try {
      var newUserQuery = await DB.query(
        `INSERT INTO users (email, password, name)
       VALUES ($1, $2, $3) RETURNING *`,
        [EMAIL, HASH, NAME],
      );
    } catch (err) {
      console.log(`Error Adding New User to the DB: ${err}`);
    }

    if (newUserQuery.rows.lengh === 0)
      res.send("Catastrophic Server Failure").status(500);

    const NEW_USER = newUserQuery.rows[0];
    const USER_ROLE_ID = 2;
    const USER_ROLE_NAME = "user";

    try {
      var userQuery = await DB.query(
        `INSERT INTO user_roles (user_id, role_id, email, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
        [NEW_USER.id, USER_ROLE_ID, EMAIL, USER_ROLE_NAME],
      );
    } catch (err) {
      console.log(`DB Error: ${err}`);
    }

    if (userQuery.rows.length === 0) res.send("Unexpected Failure").status(500);

    const USER = userQuery.rows[0];

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
    try {
      var result = await DB.query("SELECT * FROM users WHERE email = $1 ", [
        username,
      ]);
    } catch (err) {
      console.log(`DB Error ${err}`);
    }

    if (result.rows.length === 0) return callback("User not found");

    const USER = result.rows[0];
    const STORED_HASHED_PASSWORD = USER.password;

    try {
      const VALID = await bcrypt.compare(password, STORED_HASHED_PASSWORD);

      if (!VALID) return callback(null, false);

      try {
        var userQuery = await DB.query(
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
      } catch (err) {
        console.log(`DB Error ${err}`);
      }
      const USER_DATA = {
        id: USER.id,
        email: userQuery.rows[0].email,
        role: userQuery.rows[0].role,
        cart: await getCart()
      }

      return callback(null, USER_DATA);
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
