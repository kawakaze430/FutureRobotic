import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {safeMarkdownUrl} from '../lib/safe-markdown-url';
import {MarkdownResult} from '../app/result-reading';

test('SEC-003 enforces explicit Markdown link destinations', () => {
  for (const value of ['https://example.com/help?q=1#top','http://127.0.0.1:8080/test',
                       'mailto:engineer@example.com','/help/faq?q=1','#section','/'])
    assert.equal(safeMarkdownUrl(value),value);
  for (const value of ['javascript:alert(1)','JaVaScRiPt:alert(1)','data:text/html,hi',
                       'vbscript:evil','file:///tmp/a','http:javascript:alert(1)',
                       'https:evil.example','//evil.example','\\\\evil.example',
                       'https://user:pass@example.com','https://user@example.com',
                       'https://bad.example\\@good.example',
                       'mailto:a@example.com?body=bcc:x','mailto:a@b.com%0abcc:other',
                       '/\\evil','https://example.com\njavascript:bad',
                       ' https://example.com','https://example.com ','#<img>','/<svg>',
                       'http://',''])
    assert.equal(safeMarkdownUrl(value),'',JSON.stringify(value));
  assert.equal(safeMarkdownUrl('a'.repeat(2049)),'');
});

test('SEC-003 sanitizes rendered AI-controlled Markdown without stripping legitimate links',()=>{
  const content=[
    '[real](https://example.com/docs)',
    '[help](/faqs)',
    '[anchor](#results)',
    '[email](mailto:engineer@example.com)',
    '[ambiguous](https:javascript:alert(1))',
    '[credentialed](https://a:b@example.com/)',
    '[script](javascript:alert(1))'
  ].join(' ');
  const html=renderToStaticMarkup(React.createElement(MarkdownResult,{content}));
  assert.ok(html.includes('href="https://example.com/docs"'));
  assert.ok(html.includes('href="/faqs"'));
  assert.ok(html.includes('href="#results"'));
  assert.ok(html.includes('href="mailto:engineer@example.com"'));
  assert.ok(!html.includes('href="https:javascript'));
  assert.ok(!html.includes('href="https://a:b@'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(html.includes('rel="noreferrer noopener"'));
});
