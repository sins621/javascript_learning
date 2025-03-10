import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import "dotenv/config";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import DatabaseHandler from "./models/databasehandler.js";
import Mailer from "./models/mailer.js";
import API from "./models/api.js";

// TODO: Error Handling
// TODO: Continue Migration of db Functions to db Class.
// FIX: HTML Characters Ending Up in Cart Names

const app = express();
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(morgan("tiny"));
app.use(passport.initialize());
app.use(passport.session());

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

const mailer = new Mailer(process.env.MAIL_USER, process.env.MAIL_PASS);

// Home
app.get("/", async (req, res) => {
  var books = await databaseHandler.fetchAllBooks();

  if (books.length === 0) return res.send("Error Retrieving Books").status(500);

  return res.render("index.ejs", {
    categories: CATEGORIES,
    books: books,
    user: req.user,
  });
});

app.get("/filter", async (req, res) => {
  var books = databaseHandler.fetchAllBooks({ category: req.query.category });

  if (books.length === 0) return res.send("Error Retrieving Books").status(500);

  return res.render("index.ejs", {
    categories: CATEGORIES,
    books: books,
    user: req.user,
  });
});

app.get("/add_book", async (req, res) => {
  if (req.isAuthenticated() === false) return res.render("login.ejs");

  if (req.user.role != "admin") return res.redirect("/");

  return res.render("add_book.ejs");
});

app.post("/add_book", async (req, res) => {
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

app.post("/submit", async (req, res) => {
  if (!req.body) return res.send("Server Error").status(500);

  const BOOK = JSON.parse(req.body.book);
  const BOOK_INFO = await databaseHandler.addBook([
    BOOK.title,
    BOOK.author_name[0],
    req.body.category,
    BOOK.publish_year[0],
    req.body.abstract,
    BOOK.cover_i,
    req.body.quantity,
    req.body.price,
  ]);
  databaseHandler.addLog({
    event: "Add",
    object: "Books",
    description: `User: ${req.user.email} Added ${BOOK_INFO.title} to The Catalog.`,
    createdBy: req.user.email,
  });

  const SUBSCRIBERS = await databaseHandler.fetchSubscribers();

  mailer.notifySubscribers(
    SUBSCRIBERS,
    `${BOOK.title} just got added to the Catalog!`,
    `${BOOK.title} by ${BOOK.author_name}.
${req.body.abstract}

Visit your nearest Knowl & Tree Bookstore to Grab a Copy!`
  );

  return res.redirect("/");
});

app.get("/book_focus", async (req, res) => {
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

app.post("/add_review", async (req, res) => {
  if (!req.user || !req.body) return res.send("Server Error").status(500);
  const REVIEW_INFO = await databaseHandler.addBookReview([
    req.body.title,
    req.user.name,
    today(),
    req.body.review,
    req.user.id,
    req.body.rating,
    req.body.book_id,
  ]);
  databaseHandler.addLog({
    event: "Add",
    object: "Review",
    description: `User: ${req.user.email} Added "${
      REVIEW_INFO.review_title
    }" to ${
      (await databaseHandler.fetchBooksBy("id", REVIEW_INFO.book_id))[0].title
    }`,
    createdBy: req.user.email,
  });

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

app.get("/cart", async (req, res) => {
  if (req.isAuthenticated() === false) return res.render("login.ejs");

  req.user.cart = await databaseHandler.fetchCartItems(req.user.id);

  return res.render("cart.ejs", { user: req.user });
});

app.get("/add_cart", async (req, res) => {
  const BOOK_INFO = await databaseHandler.addBookToCart(
    req.query.book_id,
    req.user.id
  );

  databaseHandler.addLog({
    event: "Add",
    object: "Cart",
    description: `User: ${req.user.email} Added ${BOOK_INFO.book_title} to Their Cart`,
    createdBy: req.user.email,
  });
  req.user.cart = await databaseHandler.fetchCartItems(req.user.id);
  return res.redirect(`/book_focus?book_id=${req.query.book_id}`);
});

app.get("/user_panel", async (req, res) => {
  if (req.user.role !== "admin") res.redirect("/login");
  const SITE_USERS = await databaseHandler.fetchAllUsersRoles();
  return res.render("user_panel.ejs", { site_users: SITE_USERS });
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return next(err);

    return res.redirect("/");
  });
});

app.get("/login", (_req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

app.get("/register", (_req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
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
  const USER = await databaseHandler.addUser(EMAIL, HASH, NAME);
  databaseHandler.addLog({
    event: "Register",
    object: "Users",
    description: `User: ${USER.email} Registered an Account.`,
    createdBy: USER.email,
  });

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

    const USER_EMAIL_AND_ROLE = await databaseHandler.fetchUserByHighestRole(
      USER.id
    );
    databaseHandler.addLog({
      event: "Login",
      object: "Users",
      description: `User: ${USER_EMAIL_AND_ROLE.email} Logged In.`,
      createdBy: USER_EMAIL_AND_ROLE.email,
    });

    return callback(null, {
      id: USER.id,
      name: USER.name,
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

const api = new API(app);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.locals.url_for = function (route, params = {}) {
  const QUERY_STRING = new URLSearchParams(params).toString();

  return QUERY_STRING ? `${route}?${QUERY_STRING}` : route;
};
