import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('HtmlMarkdownController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/html-markdown/convert (POST)', () => {
    const html = '<h1>Hello World</h1><p>This is a test</p>';
    return request(app.getHttpServer())
      .post('/html-markdown/convert')
      .send({ html })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('markdown');
        expect(res.body.markdown).toBe('# Hello World\n\nThis is a test');
      });
  });

  it('should handle empty HTML', () => {
    return request(app.getHttpServer())
      .post('/html-markdown/convert')
      .send({ html: '' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('markdown');
        expect(res.body.markdown).toBe('');
      });
  });
});
