import { describe, it, expect } from 'vitest';
import { cosineSimilarity, dotProduct, vectorNorm } from '../utils/similarity';

describe('cosineSimilarity', () => {
  // TC-SIM-001: [1,1] vs [1,1] → 1.0
  it('TC-SIM-001: 相同向量返回1.0', () => {
    const result = cosineSimilarity([1, 1], [1, 1]);
    expect(result).toBeCloseTo(1.0, 5);
  });

  // TC-SIM-002: [1,0] vs [0,1] → 0.0
  it('TC-SIM-002: 正交向量返回0.0', () => {
    const result = cosineSimilarity([1, 0], [0, 1]);
    expect(result).toBeCloseTo(0.0, 5);
  });

  // TC-SIM-003: [1,1] vs [-1,-1] → -1.0
  it('TC-SIM-003: 方向相反的向量返回-1.0', () => {
    const result = cosineSimilarity([1, 1], [-1, -1]);
    expect(result).toBeCloseTo(-1.0, 5);
  });

  // TC-SIM-005: 不同长度向量 → 0
  it('TC-SIM-005: 不同长度向量返回0', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });

  // TC-SIM-006: 空数组 → 0
  it('TC-SIM-006: 空数组返回0', () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([], [1, 2])).toBe(0);
    expect(cosineSimilarity([1, 2], [])).toBe(0);
  });

  // TC-SIM-008: 零向量 → 0
  it('TC-SIM-008: 零向量返回0', () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
    expect(cosineSimilarity([1, 2], [0, 0])).toBe(0);
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
  });

  // 多维向量测试
  it('高维向量计算正确', () => {
    const a = [1, 2, 3, 4, 5];
    const b = [1, 2, 3, 4, 5];
    expect(cosineSimilarity(a, b)).toBeCloseTo(1.0, 5);
  });

  it('部分相似向量返回0到1之间的值', () => {
    const result = cosineSimilarity([1, 2, 3], [2, 4, 6]);
    expect(result).toBeCloseTo(1.0, 5);
  });
});

describe('dotProduct', () => {
  it('计算点积', () => {
    expect(dotProduct([1, 2, 3], [4, 5, 6])).toBe(32); // 1*4 + 2*5 + 3*6 = 32
  });

  it('长度不一致返回0', () => {
    expect(dotProduct([1, 2], [1, 2, 3])).toBe(0);
  });

  it('空数组返回0', () => {
    expect(dotProduct([], [])).toBe(0);
  });

  it('零向量点积为0', () => {
    expect(dotProduct([1, 2, 3], [0, 0, 0])).toBe(0);
  });
});

describe('vectorNorm', () => {
  it('计算向量范数', () => {
    expect(vectorNorm([3, 4])).toBe(5); // √(9+16) = 5
  });

  it('单位向量范数为1', () => {
    expect(vectorNorm([1, 0])).toBe(1);
    expect(vectorNorm([0, 1])).toBe(1);
    expect(vectorNorm([1, 0, 0])).toBe(1);
  });

  it('空向量范数为0', () => {
    expect(vectorNorm([])).toBe(0);
  });

  it('零向量范数为0', () => {
    expect(vectorNorm([0, 0, 0])).toBe(0);
  });

  it('多维向量范数计算正确', () => {
    const norm = vectorNorm([1, 2, 3]);
    expect(norm).toBeCloseTo(Math.sqrt(14), 5);
  });
});
