/**
 * 打字机效果工具函数
 * 基于 requestAnimationFrame 实现流畅的逐字显示效果
 */

export interface TypingEffectOptions {
  /** 完整文本内容 */
  text: string;
  /** 回调函数，每次显示新字符时触发 */
  onChar: (char: string, currentText: string) => void;
  /** 完成回调 */
  onComplete?: (fullText: string) => void;
  /** 每个字符的显示间隔（毫秒），默认 30ms */
  interval?: number;
}

export interface TypingEffectInstance {
  /** 停止打字效果 */
  stop: () => void;
  /** 暂停打字效果 */
  pause: () => void;
  /** 恢复打字效果 */
  resume: () => void;
  /** 是否正在运行 */
  isRunning: () => boolean;
}

/**
 * 创建打字机效果实例
 * @param options 配置选项
 * @returns 打字机效果控制实例
 */
export function createTypingEffect(options: TypingEffectOptions): TypingEffectInstance {
  const { text, onChar, onComplete, interval = 30 } = options;

  let currentIndex = 0;
  let isActive = true;
  let isPaused = false;
  let timeoutId: number | null = null;

  const run = () => {
    if (!isActive) return;

    if (isPaused) {
      timeoutId = window.setTimeout(run, interval);
      return;
    }

    if (currentIndex < text.length) {
      const char = text[currentIndex];
      currentIndex++;
      onChar(char, text.slice(0, currentIndex));
      timeoutId = window.setTimeout(run, interval);
    } else {
      onComplete?.(text);
    }
  };

  run();

  return {
    stop: () => {
      isActive = false;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
    pause: () => {
      isPaused = true;
    },
    resume: () => {
      isPaused = false;
    },
    isRunning: () => isActive && !isPaused
  };
}

/**
 * 使用 requestAnimationFrame 的优化打字机效果
 * 适合更流畅的动画效果
 */
export function createSmoothTypingEffect(
  text: string,
  onUpdate: (displayedText: string) => void,
  duration: number = 1000,
  onComplete?: () => void
): TypingEffectInstance {
  let startTime: number | null = null;
  let animationId: number | null = null;
  let isActive = true;
  let isPaused = false;

  const animate = (timestamp: number) => {
    if (!isActive) return;

    if (isPaused) {
      animationId = requestAnimationFrame(animate);
      return;
    }

    if (startTime === null) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const charCount = Math.floor(progress * text.length);
    const displayedText = text.slice(0, charCount);

    onUpdate(displayedText);

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  };

  animationId = requestAnimationFrame(animate);

  return {
    stop: () => {
      isActive = false;
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
    pause: () => {
      isPaused = true;
    },
    resume: () => {
      isPaused = false;
    },
    isRunning: () => isActive && !isPaused
  };
}
