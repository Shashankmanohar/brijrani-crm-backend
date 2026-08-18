import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || 'smtp.mailtrap.io';
const smtpPort = parseInt(process.env.SMTP_PORT || '2525', 10);
const smtpUser = process.env.SMTP_USER || '';
const smtpPassword = process.env.SMTP_PASSWORD || '';
const smtpFrom = process.env.SMTP_FROM || 'no-reply@brijranierp.com';

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  auth: smtpUser && smtpPassword ? {
    user: smtpUser,
    pass: smtpPassword
  } : undefined
});

export const sendMail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    if (!smtpUser || !smtpPassword) {
      console.log(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}`);
      return true;
    }
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error('Email send failure:', err);
    return false;
  }
};
