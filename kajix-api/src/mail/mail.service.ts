import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    // Log environment variables for debugging
    this.logger.log(`EMAIL_HOST: ${process.env.EMAIL_HOST}`);
    this.logger.log(`EMAIL_PORT: ${process.env.EMAIL_PORT}`);
    this.logger.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);

    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT!);
    const user = process.env.EMAIL_USER;
    const password = process.env.EMAIL_PASSWORD;

    this.logger.log(
      `Configuring mail service with host: ${host}, port: ${port}`,
    );

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for port 465, false for other ports
      auth: {
        user,
        pass: password,
      },
    });

    // Verify connection configuration
    void this.verifyConnection();
  }

  private async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Successfully connected to email server');
      return true;
    } catch (error) {
      this.logger.error('Failed to connect to email server', error);
      return false;
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    text?: string,
    html?: string,
  ): Promise<void> {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html,
      };
      if (await this.verifyConnection()) {
        await this.transporter.sendMail(mailOptions);
      } else {
        this.logger.error(`Failed to send email to ${to}`);
        throw new Error('Failed to send email: Connection verification failed');
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}.`, error);
      throw new Error(
        `Failed to send email: ${error.message}. Please try again later.`,
      );
    }
  }
}
