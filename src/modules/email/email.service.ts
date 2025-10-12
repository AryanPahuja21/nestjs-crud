import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor() {
    // Configure transporter (you'll need to set these environment variables)
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/auth/verify-email/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <p>Hi ${name},</p>
          <p>Thank you for registering with us! Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            This verification link will expire in 24 hours. If you didn't create an account with us, please ignore this email.
          </p>
        </div>
      `,
      text: `
        Hi ${name},
        
        Thank you for registering with us! Please verify your email address by clicking the following link:
        ${verificationUrl}
        
        This verification link will expire in 24 hours. If you didn't create an account with us, please ignore this email.
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome! Your Email is Verified',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #28a745; text-align: center;">Welcome to Our Platform!</h2>
          <p>Hi ${name},</p>
          <p>Congratulations! Your email address has been successfully verified. You now have full access to all features of our platform.</p>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p style="margin-top: 30px;">
            Best regards,<br>
            The Support Team
          </p>
        </div>
      `,
      text: `
        Hi ${name},
        
        Congratulations! Your email address has been successfully verified. You now have full access to all features of our platform.
        
        If you have any questions or need assistance, please don't hesitate to contact our support team.
        
        Best regards,
        The Support Team
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      // Don't throw error for welcome email failures as it's not critical
    }
  }
}
