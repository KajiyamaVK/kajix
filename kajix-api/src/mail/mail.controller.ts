import { Body, Controller, Get, Post } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendEmailDto } from './dto/send-email.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @ApiOperation({
    summary: 'Send an email',
    description:
      'Sends an email using the configured email service. The HTML content will be wrapped in the email layout.',
  })
  @ApiBody({ type: SendEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'Email sent successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid email format or missing required fields',
  })
  @ApiResponse({
    status: 500,
    description:
      'Internal server error - Email service not available or other server errors',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: false,
        },
        message: {
          type: 'string',
          example: 'Failed to send email: SMTP connection failed',
        },
      },
    },
  })
  async sendEmail(
    @Body() sendEmailDto: SendEmailDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.mailService.sendEmail(
      sendEmailDto.to,
      sendEmailDto.subject,
      sendEmailDto.contentHtml,
    );

    return {
      success: true,
      message: 'Email sent successfully',
    };
  }

  @Get('status')
  @ApiOperation({
    summary: 'Check email service status',
    description:
      'Verifies if the email service is operational by attempting to send a test email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the current status of the email service',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'Mail service is operational',
          description: 'Current status of the mail service',
        },
      },
    },
  })
  async getMailServiceStatus(): Promise<{ status: string }> {
    try {
      await this.mailService.sendEmail(
        process.env.EMAIL_USER!,
        'Mail Service Status Check',
        '<div>Mail service connection test.</div>',
      );
      return { status: 'Mail service is operational' };
    } catch {
      return { status: 'Mail service is not operational' };
    }
  }
}
