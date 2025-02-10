import pg from "pg";

const { Client } = pg;

const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "123456",
  port: 5432,
});

client.connect();
let quiz;

client.query("SELECT * FROM capitals", (err, res) => {
  if (err) {
    console.error("Error executing query", err.stack);
  } else {
    quiz = res.rows;
  }

  console.log(quiz);
  client.end();
});

console.log(quiz);
