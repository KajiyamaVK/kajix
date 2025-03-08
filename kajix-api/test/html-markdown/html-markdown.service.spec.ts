import { Test, TestingModule } from '@nestjs/testing';
import { HtmlMarkdownService } from '../../src/html-markdown/html-markdown.service';

describe('HtmlMarkdownService', () => {
  let service: HtmlMarkdownService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HtmlMarkdownService],
    }).compile();

    service = module.get<HtmlMarkdownService>(HtmlMarkdownService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should convert HTML to Markdown', async () => {
    const html = '<h1>Hello World</h1><p>This is a test</p>';
    const result = await service.convertHtmlToMarkdown({ html });
    expect(result).toEqual({
      markdown: '# Hello World\n\nThis is a test',
    });
  });

  it('should handle empty HTML', async () => {
    const html = '';
    const result = await service.convertHtmlToMarkdown({ html });
    expect(result).toEqual({
      markdown: '',
    });
  });
});
