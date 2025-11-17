import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 导入翻译文件
import zhCN from '../locales/zh-CN/common.json'
import enUS from '../locales/en-US/common.json'
import zhTW from '../locales/zh-TW/common.json'

// 语言资源
const resources = {
  'zh-CN': {
    translation: zhCN
  },
  'en-US': {
    translation: enUS
  },
  'zh-TW': {
    translation: zhTW
  }
}

// 初始化i18n
i18n
  .use(LanguageDetector) // 自动检测用户语言
  .use(initReactI18next) // 集成React
  .init({
    resources,
    fallbackLng: 'zh-CN', // 默认语言
    lng: localStorage.getItem('language') || 'zh-CN', // 从本地存储读取或使用默认值

    interpolation: {
      escapeValue: false // React已经做了XSS防护
    },

    detection: {
      // 语言检测顺序
      order: ['localStorage', 'navigator', 'htmlTag'],
      // 本地存储的key
      lookupLocalStorage: 'language',
      // 缓存用户语言选择
      caches: ['localStorage']
    }
  })

export default i18n

// 导出语言选项供选择器使用
export const languages = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' }
]

// 切换语言的辅助函数
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng)
  localStorage.setItem('language', lng)
  // 触发自定义事件，让其他组件知道语言已更改
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: lng }))
}
