import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock icons
vi.mock('@element-plus/icons-vue', () => ({
  Document: { template: '<span class="icon-document" />' },
  DocumentCopy: { template: '<span class="icon-document-copy" />' },
}));

// 导入组件
import TextPreview from '@/components/TextPreview.vue';

// Mock 组件 stubs
const mockElIcon = {
  template: '<span class="el-icon"><slot /></span>',
};

const mockElButton = {
  template: '<button class="el-button" @click="$emit(\'click\')"><slot /></button>',
  emits: ['click'],
};

describe('TextPreview.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TC-PREVIEW-001: 空状态显示', () => {
    it('空文本时显示空状态提示', async () => {
      const wrapper = mount(TextPreview, {
        props: { text: '' },
        global: {
          stubs: {
            'el-icon': mockElIcon,
            'el-button': mockElButton,
          },
        },
      });

      await nextTick();
      expect(wrapper.find('.empty-state').exists()).toBe(true);
      expect(wrapper.find('.empty-text').text()).toBe('请先上传并解析文档');
      expect(wrapper.find('.preview-header').exists()).toBe(false);
    });

    it('无文本时显示空状态', async () => {
      const wrapper = mount(TextPreview, {
        props: { text: '' },
        global: {
          stubs: {
            'el-icon': mockElIcon,
            'el-button': mockElButton,
          },
        },
      });

      await nextTick();
      expect(wrapper.find('.empty-state').exists()).toBe(true);
    });
  });

  describe('TC-PREVIEW-002: 文本内容显示', () => {
    it('有文本时显示内容和字数统计', async () => {
      const testText = '这是一个测试文档内容';
      const wrapper = mount(TextPreview, {
        props: { text: testText },
        global: {
          stubs: {
            'el-icon': mockElIcon,
            'el-button': mockElButton,
          },
        },
      });

      await nextTick();

      expect(wrapper.find('.empty-state').exists()).toBe(false);
      expect(wrapper.find('.preview-header').exists()).toBe(true);
      expect(wrapper.find('.text-length').text()).toBe(`当前文本长度：${testText.length}字`);
      expect(wrapper.find('.text-content').text()).toBe(testText);
    });

    it('显示正确的中文字符统计', async () => {
      const chineseText = '中文字符测试内容';
      const wrapper = mount(TextPreview, {
        props: { text: chineseText },
        global: {
          stubs: {
            'el-icon': mockElIcon,
            'el-button': mockElButton,
          },
        },
      });

      await nextTick();
      expect(wrapper.find('.text-length').text()).toBe(`当前文本长度：${chineseText.length}字`);
    });
  });

  describe('TC-PREVIEW-003: 复制功能成功', () => {
    it('复制按钮存在且可点击', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const wrapper = mount(TextPreview, {
        props: { text: '测试文本' },
        global: {
          stubs: {
            'el-icon': mockElIcon,
            'el-button': mockElButton,
          },
        },
      });

      await nextTick();

      const copyButton = wrapper.find('button');
      expect(copyButton.exists()).toBe(true);
      expect(copyButton.text()).toContain('复制全文');
    });

    it('点击复制按钮应调用 clipboard API', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const testText = '要复制的文本内容';
      const wrapper = mount(TextPreview, {
        props: { text: testText },
        global: {
          stubs: {
            'el-icon': mockElIcon,
            'el-button': mockElButton,
          },
        },
      });

      await nextTick();
      await wrapper.find('button').trigger('click');

      expect(writeTextMock).toHaveBeenCalledWith(testText);
    });
  });

  describe('TC-PREVIEW-004: 复制功能失败处理', () => {
    it('复制失败时应捕获异常不抛出', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'));
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const wrapper = mount(TextPreview, {
        props: { text: '测试文本' },
        global: {
          stubs: {
            'el-icon': mockElIcon,
            'el-button': mockElButton,
          },
        },
      });

      await nextTick();
      // 不应该抛出错误
      await expect(wrapper.find('button').trigger('click')).resolves.toBeUndefined();
    });
  });

  describe('布局结构', () => {
    it('文本预览容器应正确渲染', async () => {
      const wrapper = mount(TextPreview, {
        props: { text: '测试' },
        global: {
          stubs: {
            'el-icon': mockElIcon,
            'el-button': mockElButton,
          },
        },
      });

      expect(wrapper.find('.text-preview').exists()).toBe(true);
    });

    it('预览内容区域应正确渲染', async () => {
      const wrapper = mount(TextPreview, {
        props: { text: '测试内容' },
        global: {
          stubs: {
            'el-icon': mockElIcon,
            'el-button': mockElButton,
          },
        },
      });

      expect(wrapper.find('.preview-content').exists()).toBe(true);
      expect(wrapper.find('.text-content').exists()).toBe(true);
    });
  });
});
