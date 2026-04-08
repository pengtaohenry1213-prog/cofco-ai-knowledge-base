/**
 * 向量相似度计算工具函数
 * 在 src/utils/similarity.ts 中实现余弦相似度计算逻辑：
 * - 编写通用的余弦相似度计算函数，接收两个 embedding 数组（number[]），返回 0-1 之间的相似度值；
 * - 处理边界情况（embedding 长度不一致、空数组），添加参数校验和错误捕获；
 * - 使用 TS 定义函数入参/返回值类型；
 *  - 编写简单测试用例验证计算正确性（如固定 embedding 验证相似度结果）。
 * 
 * @example
 * ```typescript
 * const similarity = cosineSimilarity([1, 2, 3], [4, 5, 6]);
 * console.log(similarity); // 0.9746318461970762
 * ```
 */

/**
 * 计算向量点积
 * A·B = Σ(a_i × b_i)
 */
export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * 计算向量范数（模长）
 * ||A|| = √(Σ(a_i²))
 */
export function vectorNorm(vec: number[]): number {
  if (vec.length === 0) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

/**
 * 计算两个向量的余弦相似度
 * cos(θ) = (A·B) / (||A|| × ||B||)
 *
 * 返回值范围: [-1, 1]
 * - 1: 方向完全相同
 * - 0: 正交（无相关性）
 * - -1: 方向完全相反
 *
 * 边界处理:
 * - 长度不一致 → 返回 0
 * - 空数组 → 返回 0
 * - 零向量 → 返回 0
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  // 长度不一致或空数组
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  const normA = vectorNorm(a);
  const normB = vectorNorm(b);

  // 零向量（模长为0）
  if (normA === 0 || normB === 0) {
    return 0;
  }

  const dot = dotProduct(a, b);
  return dot / (normA * normB);
}
