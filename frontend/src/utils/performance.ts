// 性能监控工具

interface PerformanceMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // 监听页面加载完成
    window.addEventListener('load', () => {
      this.measurePageLoad();
    });

    // 监听 FCP
    this.observePaint();

    // 监听 LCP
    this.observeLCP();

    // 监听 FID
    this.observeFID();

    // 监听 CLS
    this.observeCLS();
  }

  private measurePageLoad() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      this.metrics.TTFB = navigation.responseStart - navigation.requestStart;

      console.log('⚡ 性能指标:');
      console.log(`  TTFB: ${this.metrics.TTFB?.toFixed(2)}ms`);
      console.log(`  DOM Content Loaded: ${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`);
      console.log(`  Load Complete: ${navigation.loadEventEnd - navigation.loadEventStart}ms`);
    }
  }

  private observePaint() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.FCP = entry.startTime;
          console.log(`✨ FCP: ${entry.startTime.toFixed(2)}ms`);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch (e) {
      // 某些浏览器可能不支持
    }
  }

  private observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.LCP = lastEntry.startTime;
      console.log(`🖼️ LCP: ${lastEntry.startTime.toFixed(2)}ms`);
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // 某些浏览器可能不支持
    }
  }

  private observeFID() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fidEntry = entry as any;
        this.metrics.FID = fidEntry.processingStart - fidEntry.startTime;
        console.log(`⚡ FID: ${this.metrics.FID?.toFixed(2)}ms`);
      }
    });

    try {
      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // 某些浏览器可能不支持
    }
  }

  private observeCLS() {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShiftEntry = entry as any;
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
          this.metrics.CLS = clsValue;
          console.log(`📐 CLS: ${clsValue.toFixed(4)}`);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // 某些浏览器可能不支持
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // 测量自定义操作的性能
  public measureAction(name: string, action: () => void | Promise<void>) {
    const startTime = performance.now();

    const result = action();

    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime;
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      });
    } else {
      const duration = performance.now() - startTime;
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }
  }

  // 生成性能报告
  public generateReport(): string {
    const metrics = this.getMetrics();
    let report = '性能报告:\n';
    report += `  FCP: ${metrics.FCP?.toFixed(2) || 'N/A'}ms\n`;
    report += `  LCP: ${metrics.LCP?.toFixed(2) || 'N/A'}ms\n`;
    report += `  FID: ${metrics.FID?.toFixed(2) || 'N/A'}ms\n`;
    report += `  CLS: ${metrics.CLS?.toFixed(4) || 'N/A'}\n`;
    report += `  TTFB: ${metrics.TTFB?.toFixed(2) || 'N/A'}ms\n`;

    // 评分
    let score = 100;
    if (metrics.FCP && metrics.FCP > 1800) score -= 20;
    if (metrics.LCP && metrics.LCP > 2500) score -= 20;
    if (metrics.FID && metrics.FID > 100) score -= 20;
    if (metrics.CLS && metrics.CLS > 0.1) score -= 20;
    if (metrics.TTFB && metrics.TTFB > 600) score -= 20;

    report += `\n综合评分: ${Math.max(score, 0)}/100`;

    return report;
  }
}

// 导出单例
export const performanceMonitor = new PerformanceMonitor();

// 开发环境自动启用
if (import.meta.env.DEV) {
  (window as any).performanceMonitor = performanceMonitor;
  console.log('🔍 性能监控已启用。使用 performanceMonitor.generateReport() 查看报告');
}
