/* 
1. Use the inquirer npm package to get user input.
2. Use the qr-image npm package to turn the user entered URL into a QR code image.
3. Create a txt file to save the user input using the native fs node module.
*/
import { input } from "@inquirer/prompts";
import { image } from "qr-image";
import fs from "node:fs";

const url = await input({ message: "Enter your name" });
var qr_svg = image(url, { type: "svg" });
qr_svg.pipe(fs.createWriteStream("qr.svg"));

fs.writeFile("URL.txt", url, { flag: "a" }, (err) => {
  if (err) {
    console.error(err);
  } else {
  }
});
