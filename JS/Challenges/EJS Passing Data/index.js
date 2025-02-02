import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
let headingText = "Enter your name below:";

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.render("index.ejs", {
    heading: headingText,
  });
});

app.post("/submit", (req, res) => {
  let nameLength = req.body.fName.length + req.body.lName.length;
  headingText = `Your name is ${nameLength} characters long`;
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
