require('dotenv').config()
const nodemailer = require('nodemailer')

async function mailSender(email, title, body){
    try {
        //to send email ->  firstly create a Transporter
        const transporter = nodemailer.createTransport({
            service: process.env.SMTP_SERVICE,
            host: process.env.SMTP_MAIL_HOST,  //-> Host SMTP detail
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE,
            auth: {
                user: process.env.SMTP_MAIL_USER,  //-> User's mail for authentication
                pass: process.env.SMTP_MAIL_PASS,  //-> User's password for authentication
            }
        })

        //Send e-mails to users
        let info = await transporter.sendMail({
            from: process.env.SMTP_MAIL_USER,
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        })

        console.log("Info is here: ", info)
        return info

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = mailSender;