import { Module } from '@nestjs/common';
import { HtmlMarkdownController } from './html-markdown.controller';
import { HtmlMarkdownService } from './html-markdown.service';

@Module({
  controllers: [HtmlMarkdownController],
  providers: [HtmlMarkdownService],
  exports: [HtmlMarkdownService],
})
export class HtmlMarkdownModule {}
