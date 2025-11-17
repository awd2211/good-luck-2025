# C端国际化功能使用指南

## 概述

C端（用户前端）已完整集成国际化支持，支持以下语言：
- 🇨🇳 **简体中文** (zh-CN) - 默认语言
- 🇺🇸 **English** (en-US)
- 🇹🇼 **繁體中文** (zh-TW)

## 技术栈

- **i18next**: 核心国际化框架
- **react-i18next**: React集成
- **i18next-browser-languagedetector**: 自动检测用户语言

## 项目结构

```
frontend/src/
├── i18n/
│   └── index.ts                 # i18n配置和初始化
├── locales/
│   ├── zh-CN/
│   │   └── common.json          # 简体中文翻译
│   ├── en-US/
│   │   └── common.json          # 英文翻译
│   └── zh-TW/
│   │   └── common.json          # 繁体中文翻译
└── components/
    ├── LanguageSwitcher.tsx     # 语言切换组件
    └── LanguageSwitcher.css
```

## 使用方法

### 1. 在组件中使用翻译

```typescript
import { useTranslation } from 'react-i18next'

const MyComponent = () => {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('app.name')}</h1>
      <p>{t('app.slogan')}</p>
    </div>
  )
}
```

### 2. 使用语言切换器

语言切换器已集成到 `MainLayout`，位于页面右上角。用户可以通过点击切换语言。

### 3. 添加新的翻译

1. 在 `locales/{语言}/common.json` 中添加新的键值对：

```json
{
  "新功能": {
    "标题": "新功能标题",
    "描述": "新功能描述"
  }
}
```

2. 在组件中使用：

```typescript
<h2>{t('新功能.标题')}</h2>
<p>{t('新功能.描述')}</p>
```

## 翻译文件结构

所有翻译按功能模块组织：

- `app`: 应用基本信息
- `nav`: 导航栏
- `common`: 通用文本
- `auth`: 认证相关
- `home`: 首页
- `service`: 服务相关
- `cart`: 购物车
- `order`: 订单
- `payment`: 支付
- `trust`: 信任保障
- `paymentTrust`: 支付页信任
- `profile`: 个人中心

## 已翻译的组件和页面

### ✅ 核心页面（已完成）
1. **HomePage** - 首页（搜索、分类、服务列表、快捷功能）
2. **LoginPage** - 登录页（邮箱/验证码登录、表单验证）
3. **ProfilePage** - 个人中心（用户信息、菜单、画像统计）
4. **BottomNav** - 底部导航（首页/分类/购物车/我的）
5. **CartPage** - 购物车（商品列表、全选、删除、结算）
6. **FortuneDetail** - 服务详情（价格、评价、服务流程、操作按钮）
7. **CheckoutPage** - 支付页（订单确认、优惠券、支付方式、价格汇总）

### ✅ 基础组件（已完成）
8. **TrustFooter** - 底部信任区域
9. **PaymentTrustSection** - 支付页信任保障
10. **LanguageSwitcher** - 语言切换器

### 🎉 翻译完成
所有主要页面和组件的国际化翻译已全部完成！支持简体中文、English和繁體中文三种语言。
- 其他业务页面可根据需要逐步添加

## 语言切换逻辑

1. **初次访问**:
   - 检查 localStorage 中保存的语言
   - 如无，检测浏览器语言
   - 默认使用简体中文

2. **切换语言**:
   - 用户选择语言后立即生效
   - 自动保存到 localStorage
   - 下次访问直接使用保存的语言

3. **语言检测顺序**:
   ```
   localStorage → 浏览器语言 → 默认语言(zh-CN)
   ```

## API参考

### changeLanguage

切换语言的辅助函数：

```typescript
import { changeLanguage } from '../i18n'

// 切换到英文
changeLanguage('en-US')

// 切换到繁体中文
changeLanguage('zh-TW')

// 切换到简体中文
changeLanguage('zh-CN')
```

### languages

可用语言列表：

```typescript
import { languages } from '../i18n'

languages.forEach(lang => {
  console.log(lang.code, lang.name, lang.flag)
})
```

## 开发建议

1. **保持一致性**: 所有新功能都应添加三语翻译
2. **使用嵌套**: 相关翻译文本应该嵌套在同一个对象下
3. **避免硬编码**: 不要在组件中硬编码文本
4. **命名规范**: 使用驼峰命名法，如 `userProfile.editButton`

## 测试

访问 https://www.luck.day，点击右上角的语言切换器测试：

1. ✅ 简体中文 → 英文
2. ✅ 英文 → 繁体中文
3. ✅ 繁体中文 → 简体中文
4. ✅ 刷新页面语言保持

## 未来扩展

如需添加更多语言：

1. 在 `locales/` 目录下创建新的语言文件夹
2. 复制 `common.json` 并翻译内容
3. 在 `i18n/index.ts` 中导入并注册新语言
4. 在 `languages` 数组中添加新语言选项

示例（添加日语）：

```typescript
// i18n/index.ts
import ja from '../locales/ja-JP/common.json'

const resources = {
  // ...现有语言
  'ja-JP': {
    translation: ja
  }
}

export const languages = [
  // ...现有语言
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' }
]
```

## 注意事项

⚠️ **重要**:
- 所有翻译文件必须保持相同的JSON结构
- 添加新键时，确保所有语言文件都同步更新
- 语言切换器在移动端会自动调整大小和位置
- 支持暗色主题自动适配

## 支持

如有问题，请查看：
- i18next文档: https://www.i18next.com/
- react-i18next文档: https://react.i18next.com/
