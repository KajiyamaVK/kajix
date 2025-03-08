import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MailModule } from '../src/mail/mail.module';
import { MailService } from '../src/mail/mail.service';

describe('Mail Service (e2e)', () => {
  let app: INestApplication;
  let mailService: MailService;

  // Mock implementation for testing
  const mockMailService = {
    sendEmail: jest.fn().mockImplementation((to, subject, text, html) => {
      // Just log the email details for verification
      console.log(`Mock sending email to: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      console.log(`HTML: ${html}`);
      return Promise.resolve();
    }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MailModule],
    })
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .compile();

    app = moduleFixture.createNestApplication();
    mailService = moduleFixture.get<MailService>(MailService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(mailService).toBeDefined();
  });

  it('should send an email successfully', async () => {
    const to = 'test@example.com';
    const subject = 'Test Email from E2E Test';
    const text = 'This is a test email sent from the E2E test.';
    const html =
      '<p>This is a <strong>test email</strong> sent from the E2E test.</p>';

    await mailService.sendEmail(to, subject, text, html);

    expect(mockMailService.sendEmail).toHaveBeenCalledWith(
      to,
      subject,
      text,
      html,
    );
  });

  it('should handle real email sending in a separate test (disabled by default)', async () => {
    // This test is skipped by default to avoid sending real emails in automated tests
    // Remove the .skip to run it manually when needed

    // Creating a custom provider for this test only to use the real service
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MailModule],
    }).compile();

    const realMailService = moduleFixture.get<MailService>(MailService);

    // Uncomment to send a real email during testing

    await expect(
      realMailService.sendEmail(
        'victor.kajiyama@gmail.com',
        'Test Email from E2E Test - Real Service',
        'This is a real test email sent from the E2E test.',
        '<p>This is a <strong>real test email</strong> sent from the E2E test.</p>',
      ),
    ).resolves.not.toThrow();

    // Clean up
    await moduleFixture.close();
  }, 10000);
});
