import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

describe('Example Test Suite', () => {
  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should work with Vue reactivity', () => {
    const count = ref(0);
    count.value++;
    expect(count.value).toBe(1);
  });
});
