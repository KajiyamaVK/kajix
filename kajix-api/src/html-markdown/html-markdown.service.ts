import { Injectable } from '@nestjs/common';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import type { HtmlToMarkdownDto, MarkdownResponse } from '@kajix/types';

@Injectable()
export class HtmlMarkdownService {
  private readonly nhm: NodeHtmlMarkdown;

  constructor() {
    this.nhm = new NodeHtmlMarkdown();
  }

  async convertHtmlToMarkdown(
    dto: HtmlToMarkdownDto,
  ): Promise<MarkdownResponse> {
    const markdown = this.nhm.translate(dto.html);
    return { markdown };
  }
}
