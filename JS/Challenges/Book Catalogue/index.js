import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function input_helper(prompt) {
  return new Promise(function (resolve, reject) {
    rl.question(`${prompt}\n: `, (name) => {
      resolve(name);
    });
  });
}

let author_name = await input_helper(
  "Adding a new Book to the Database, Who is the Author of the Book?"
);

rl.close();

let book_name = await input_helper("What is the Title of the Book?");

rl.close();

console.log(`Athor: ${author_name}, Title: ${book_name}`);
