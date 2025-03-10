import nodemailer from "nodemailer";

export default class Mailer {
  constructor(user, pass) {
    this.user = user;
    this.transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: this.user,
        pass: pass,
      },
    });
  }

  async notifySubscribers(subscribers, subject, text) {
    console.log(subscribers)
    const RESULTS = await Promise.all(
      subscribers.map(async (subscriber) => {
        const MAIL_INFO = await this.transporter.sendMail({
          from: this.user,
          to: subscriber.email,
          subject: subject,
          text: text,
        });
        return MAIL_INFO.accepted;
      })
    );
    return RESULTS.flat();
  }
}
