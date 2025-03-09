import Mailer from "./models/mailer.js";
import "dotenv/config";

const mailer = new Mailer(process.env.MAIL_USER, process.env.MAIL_PASS);

console.log(
  await mailer.notifySubscribers(
    ["sinsmailza@gmail.com", "bradlycarpenterza@gmail.com"],
    "test",
    "test"
  )
);
