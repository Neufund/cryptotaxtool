import * as Moment from "moment";
import * as nodemailer from "nodemailer";

import { config } from "./config";

export const sendEmail = (filePath: string): void => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: config.email.userName,
            pass: config.email.appPassword,
        },
    });

    const mailOptions = {
        from: config.email.userName,
        to: config.email.destEmail,
        subject: `Transactions ${Moment().format("YY-MM-DD")}`,
        text: "See attachment",
        attachments: [
            {
                path: filePath,
            },
        ],
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            throw err;
        } else {
            console.log(info);
        }
    });
};
