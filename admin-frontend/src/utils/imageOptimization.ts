/**
 * 图片优化工具
 * 支持 WebP 格式和图片懒加载
 */

/**
 * 检查浏览器是否支持 WebP
 */
export const isSupportWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve(img.width > 0 && img.height > 0)
    }
    img.onerror = () => {
      resolve(false)
    }
    img.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA'
  })
}

/**
 * 获取优化后的图片URL
 * 如果支持WebP，返回WebP格式URL，否则返回原始URL
 */
export const getOptimizedImageUrl = async (url: string): Promise<string> => {
  const supportWebP = await isSupportWebP()

  if (!supportWebP) {
    return url
  }

  // 如果URL已经是WebP格式，直接返回
  if (url.endsWith('.webp')) {
    return url
  }

  // 将常见图片格式转换为WebP
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  for (const ext of imageExtensions) {
    if (url.endsWith(ext)) {
      return url.replace(ext, '.webp')
    }
  }

  return url
}

/**
 * 图片压缩
 * 将图片转换为指定质量的格式
 */
export const compressImage = (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // 计算缩放比例
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/webp',
          quality
        )
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
  })
}

/**
 * 图片懒加载Observer
 */
export class ImageLazyLoader {
  private observer: IntersectionObserver | null = null
  private images: Set<HTMLImageElement> = new Set()

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement
              this.loadImage(img)
            }
          })
        },
        {
          rootMargin: '50px',
          threshold: 0.01,
        }
      )
    }
  }

  private async loadImage(img: HTMLImageElement) {
    const src = img.dataset.src
    if (!src) return

    try {
      // 获取优化后的图片URL
      const optimizedUrl = await getOptimizedImageUrl(src)

      // 预加载图片
      const tempImg = new Image()
      tempImg.src = optimizedUrl

      await new Promise((resolve, reject) => {
        tempImg.onload = resolve
        tempImg.onerror = reject
      })

      // 设置图片源
      img.src = optimizedUrl
      img.classList.add('loaded')

      // 移除占位符类
      img.classList.remove('lazy-loading')

    } catch (error) {
      console.error('Failed to load image:', error)
      // 加载失败时使用原始URL
      img.src = src
    } finally {
      // 停止观察
      if (this.observer) {
        this.observer.unobserve(img)
      }
      this.images.delete(img)
    }
  }

  observe(img: HTMLImageElement) {
    if (this.observer) {
      this.images.add(img)
      this.observer.observe(img)
    } else {
      // 不支持IntersectionObserver，直接加载
      this.loadImage(img)
    }
  }

  unobserve(img: HTMLImageElement) {
    if (this.observer) {
      this.observer.unobserve(img)
      this.images.delete(img)
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
      this.images.clear()
    }
  }
}

// 全局懒加载实例
export const imageLazyLoader = new ImageLazyLoader()
