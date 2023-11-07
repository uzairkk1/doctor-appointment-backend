import nodemailer from "nodemailer";

export default class Email {
  constructor(user, url) {
    (this.to = user.email), (this.name = user.name);
    this.url = url;
    this.from = `Muhammad Uzair Khan <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    return nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false,
      auth: {
        // TODO: replace `user` and `pass` values from <https://forwardemail.net>
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async send(html, subject) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html,
    };
    console.log(html, subject, mailOptions);
    const transporter = this.newTransport();
    await transporter.sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send(
      `<div>Welcome!! Please verify your account by clicking this <a href=${this.url} target='_blank' > link </a> </div>`,
      "Please verify your account"
    );
  }
  async passwordReset() {
    await this.send(
      `<div>We received your password reset request, you can reset it by clicking this <a href=${this.url} target='_blank' > link </a> <p>This is only valid for 10 mins</p> </div>`,
      "Password Reset"
    );
  }
}
