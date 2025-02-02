import express from "express";

const port = 3000;
const date = new Date();
let app = express();

app.get("/", (_req, res) => {
  res.render("index.ejs", {
    day: date.getDay(),
  });
});

app.listen(port, () => {
  console.log(`App running on ${port}`);
});
