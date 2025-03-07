import { Body, Controller, Get, Post } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendEmailDto } from './dto/send-email.dto';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  async sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<{ success: boolean; message: string }> {
    try {
      await this.mailService.sendEmail(
        sendEmailDto.to,
        sendEmailDto.subject,
        sendEmailDto.text,
        sendEmailDto.html,
      );
      
      return {
        success: true,
        message: 'Email sent successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to send email',
      };
    }
  }

  @Get('status')
  async getMailServiceStatus(): Promise<{ status: string }> {
    try {
      // We'll leverage the private verifyConnection method through sendEmail
      // by sending a test email to the service itself, but we'll catch any errors
      // and just report on the status
      await this.mailService.sendEmail(
        process.env.EMAIL_USER!,
        'Mail Service Status Check',
        'This is an automated test from the mail service endpoint.',
      );
      return { status: 'Mail service is operational' };
    } catch (error) {
      return { status: 'Mail service is not operational' };
    }
  }
} 