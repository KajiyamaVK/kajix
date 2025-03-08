import { Controller, Post, Body } from '@nestjs/common';
import { HtmlMarkdownService } from './html-markdown.service';
import type { HtmlToMarkdownDto, MarkdownResponse } from '@types';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('html-markdown')
@Controller('html-markdown')
export class HtmlMarkdownController {
  constructor(private readonly htmlMarkdownService: HtmlMarkdownService) {}

  @Post('convert')
  @ApiOperation({ summary: 'Convert HTML to Markdown' })
  @ApiResponse({
    status: 201,
    description: 'HTML converted to Markdown successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async convertHtmlToMarkdown(
    @Body() dto: HtmlToMarkdownDto,
  ): Promise<MarkdownResponse> {
    return this.htmlMarkdownService.convertHtmlToMarkdown(dto);
  }
}
