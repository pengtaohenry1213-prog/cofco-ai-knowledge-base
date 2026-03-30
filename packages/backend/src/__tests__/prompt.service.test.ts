import { describe, it, expect } from 'vitest';
import { buildPrompt, validatePromptFormat } from '../services/prompt.service';

describe('buildPrompt', () => {
  // TC-PROMPT-001: 正常 Prompt 拼接
  it('TC-PROMPT-001: 正常 Prompt 拼接包含文档内容和用户问题', () => {
    const chunks = ['文档内容1', '文档内容2'];
    const question = '测试问题';
    const result = buildPrompt(question, chunks);

    expect(result.success).toBe(true);
    expect(result.prompt).toContain('文档');
    expect(result.prompt).toContain(question);
    expect(result.prompt).toContain('文档内容1');
    expect(result.prompt).toContain('文档内容2');
  });

  // TC-PROMPT-002: 单个文档块拼接
  it('TC-PROMPT-002: 单个文档块正确拼接', () => {
    const chunks = ['唯一的文档内容'];
    const question = '这是什么问题';
    const result = buildPrompt(question, chunks);

    expect(result.success).toBe(true);
    expect(result.prompt).toContain('唯一的文档内容');
    expect(result.prompt).toContain('这是什么问题');
  });

  // TC-PROMPT-003: 多个文档块拼接
  it('TC-PROMPT-003: 多个文档块用换行符分隔', () => {
    const chunks = ['第一个块', '第二个块', '第三个块'];
    const question = '问题是什么';
    const result = buildPrompt(question, chunks);

    expect(result.success).toBe(true);
    expect(result.prompt).toContain('第一个块');
    expect(result.prompt).toContain('第二个块');
    expect(result.prompt).toContain('第三个块');
    // 验证用换行符分隔
    expect(result.prompt).toContain('\n');
  });

  // TC-PROMPT-004: 空文档块数组
  it('TC-PROMPT-004: 空文档块数组返回错误', () => {
    const result = buildPrompt('问题', []);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  // TC-PROMPT-005: Prompt 格式验证
  it('TC-PROMPT-005: Prompt 包含必要标记', () => {
    const chunks = ['内容'];
    const question = '问题';
    const result = buildPrompt(question, chunks);

    expect(result.success).toBe(true);

    const validation = validatePromptFormat(result.prompt!);
    expect(validation.hasContext).toBe(true);
    expect(validation.hasQuestion).toBe(true);
  });

  // 空问题字符串
  it('空问题字符串返回错误', () => {
    const result = buildPrompt('', ['内容']);

    expect(result.success).toBe(false);
    expect(result.error).toBe('问题不能为空');
  });

  // 仅空格的问题
  it('仅空格的问题返回错误', () => {
    const result = buildPrompt('   ', ['内容']);

    expect(result.success).toBe(false);
    expect(result.error).toBe('问题不能为空');
  });

  // 仅空字符串的文档块
  it('仅空字符串的文档块返回错误', () => {
    const result = buildPrompt('问题', ['', '  ', '']);

    expect(result.success).toBe(false);
    expect(result.error).toBe('检索结果为空，无法回答问题');
  });

  // 自定义模板
  it('支持自定义模板', () => {
    const chunks = ['内容'];
    const question = '问题';
    const template = '上下文：{context}\n用户提问：{question}';
    const result = buildPrompt(question, chunks, template);

    expect(result.success).toBe(true);
    expect(result.prompt).toContain('上下文：');
    expect(result.prompt).toContain('用户提问：');
  });

  // 文档块内容包含特殊字符
  it('文档块内容包含特殊字符时正确处理', () => {
    const chunks = ['内容包含\n换行', '内容包含{大括号}', '内容包含"引号"'];
    const question = '问题';
    const result = buildPrompt(question, chunks);

    expect(result.success).toBe(true);
    expect(result.prompt).toContain('内容包含\n换行');
    expect(result.prompt).toContain('内容包含{大括号}');
  });

  // 长文档块
  it('长文档块正确拼接', () => {
    const longChunk = 'A'.repeat(1000);
    const chunks = [longChunk];
    const question = '问题';
    const result = buildPrompt(question, chunks);

    expect(result.success).toBe(true);
    expect(result.prompt).toContain(longChunk);
  });
});
