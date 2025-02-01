const fs = require("node:fs");

//fs.writeFile("message.txt", "Text", (err) => {
//  if (err) throw err;
//  console.log("Wrote File Successfully");
//});

fs.readFile("message.txt", "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
});
