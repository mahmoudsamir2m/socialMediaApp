import nodemailer from "nodemailer";
import { env } from "../../../config/env.service";
import Mail from "nodemailer/lib/mailer";

export let sendEmail = async ({
  to,
  subject,
  html,
}: Mail.Options): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.APP_EMAIL,
      pass: env.APP_PASSWORD,
    },
  });
  try {
    const info = await transporter.sendMail({
      from: `"mahmoud samir" <${env.APP_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log("Message sent:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
