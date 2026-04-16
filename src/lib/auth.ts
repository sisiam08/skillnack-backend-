import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import nodemailer from "nodemailer";
import config from "../config";


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.APP_USER,
    pass: process.env.APP_PASSWORD,
  },
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: config.baseURL,
  trustedOrigins: [config.appUrl!],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
      },
      phone: {
        type: "string",
        required: false,
      },
      status: {
        type: "string",
        defaultValue: "UNBAN",
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) => {
      try {
        const verificationURL = url;

        const info = await transporter.sendMail({
          from: "Skillnack <info@skillnack.com>",
          to: user.email,
          subject: "Verify your email for Skillnack",
          html: `<!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <title>Email Verification</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              </head>
              <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:40px 0;">
                  <tr>
                    <td align="center">
                      <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
                        
                        <!-- Header -->
                        <tr>
                          <td style="background:#ec5b13; padding:20px; text-align:center;">
                            <h1 style="color:#ffffff; margin:0; font-size:24px;">
                              Skillnack
                            </h1>
                          </td>
                        </tr>
                    
                        <!-- Body -->
                        <tr>
                          <td style="padding:30px; color:#333333;">
                            <h2 style="margin-top:0;">Verify your email address</h2>
                    
                            <p style="font-size:16px; line-height:1.6;">
                              Hi <strong>${user.name || "there"}</strong>,
                            </p>
                    
                            <p style="font-size:16px; line-height:1.6;">
                              Thank you for signing up for Skillnack.  
                              Please confirm your email address by clicking the button below.
                            </p>
                    
                            <!-- Button -->
                            <div style="text-align:center; margin:30px 0;">
                              <a
                                href="${verificationURL}"
                                style="
                                  background:#ec5b13;
                                  color:#ffffff;
                                  text-decoration:none;
                                  padding:14px 28px;
                                  border-radius:6px;
                                  font-size:16px;
                                  display:inline-block;
                                "
                              >
                                Verify Email
                              </a>
                            </div>
                    
                            <p style="font-size:14px; color:#666666; line-height:1.6;">
                              If the button doesn't work, copy and paste this link into your browser:
                            </p>
                    
                            <p style="font-size:14px; word-break:break-all;">
                              <a href="${verificationURL}" style="color:#ec5b13;">
                                ${verificationURL}
                              </a>
                            </p>
                    
                            <p style="font-size:14px; color:#666666; line-height:1.6;">
                              If you did not create an account, you can safely ignore this email.
                            </p>
                    
                            <p style="margin-top:30px; font-size:14px;">
                              — Skillnack Team
                            </p>
                          </td>
                        </tr>
                    
                        <!-- Footer -->
                        <tr>
                          <td style="background:#f1f5f9; padding:15px; text-align:center; font-size:12px; color:#777777;">
                            © ${new Date().getFullYear()} Skillnack. All rights reserved.
                          </td>
                        </tr>
                    
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
              `,
        });

        console.log("Verification email sent: ", info.messageId);
      } catch (error) {
        console.error("Error sending verification email: ", error);
      }
    },
  },
});
