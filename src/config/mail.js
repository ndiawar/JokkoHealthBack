import nodemailer from 'nodemailer';

// src/config/mail.js
export const mailConfig = {
    host: process.env.MAIL_HOST || 'smtp.example.com',
    port: process.env.MAIL_PORT || 587,
    secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USER || 'user@example.com',
        pass: process.env.MAIL_PASS || 'password',
    },
};


const transporter = nodemailer.createTransport(mailConfig);

const sendMail = (to, subject, text, html) => {
    const mailOptions = {
        from: process.env.MAIL_FROM || 'no-reply@example.com',
        to,
        subject,
        text,
        html,
    };

    return transporter.sendMail(mailOptions);
};

export { sendMail };