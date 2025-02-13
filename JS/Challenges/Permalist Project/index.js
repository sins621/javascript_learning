import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "permalist",
  password: "123456",
  port: 5432,
});

db.connect();

let items = await getItems();

async function getItems() {
  let result = await db.query("SELECT * FROM items");
  return result.rows;
}

app.get("/", async (_req, res) => {
  items = await getItems();
  res.render("index.ejs", {
    listTitle: "Today",
    listItems: items,
  });
});

app.post("/add", async (req, res) => {
  const item = req.body.newItem;
  await db.query("INSERT INTO items (title) VALUES ($1)", [item]);
  res.redirect("/");
});

app.post("/edit", async (req, res) => {
  const new_title = req.body.updatedItemTitle;
  const item_id = req.body.updatedItemId;
  await db.query("UPDATE items SET title = $1 WHERE id = $2", [
    new_title,
    item_id,
  ]);
  res.redirect("/");
});

app.post("/delete", async (req, res) => {
  const item_id = req.body.deleteItemId;
  await db.query("DELETE FROM items WHERE id = $1", [item_id]);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
