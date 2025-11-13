# 表单验证集成指南

本文档展示如何将 `formValidation.ts` 集成到 `FortuneDetail.tsx` 中。

---

## 1. 在 FortuneDetail.tsx 中导入验证工具

```typescript
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getBirthFortune,
  getBaziAnalysis,
  getFlowYearFortune,
  getNameAnalysis,
  getMarriageAnalysis,
} from '../services/api';
import { useDebounce } from '../utils/debounce';
// 👇 导入验证工具
import {
  validateBirthAnimalForm,
  validateBaziForm,
  validateFlowYearForm,
  validateNameForm,
  validateMarriageForm,
  checkValidationResults,
} from '../utils/formValidation';
import './FortuneDetail.css';
```

---

## 2. 添加错误状态

```typescript
const FortuneDetail = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // 👇 添加验证错误状态
  const [errors, setErrors] = useState<string[]>([]);

  // ... 其他状态
}
```

---

## 3. 修改 handleSubmit 添加验证逻辑

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // 👇 清空之前的错误
  setErrors([]);

  // 👇 根据不同类型验证表单
  let validationResults;

  switch (type) {
    case 'birth-animal':
    case 'life-fortune':
    case 'year-2025':
    case 'zodiac-2025':
      validationResults = validateBirthAnimalForm({
        birthYear: formData.birthYear,
        birthMonth: formData.birthMonth,
        birthDay: formData.birthDay,
      });
      break;

    case 'bazi':
    case 'career':
      validationResults = validateBaziForm({
        birthYear: formData.birthYear,
        birthMonth: formData.birthMonth,
        birthDay: formData.birthDay,
        birthHour: formData.birthHour,
        gender: formData.gender,
      });
      break;

    case 'flow-year':
      validationResults = validateFlowYearForm({
        birthYear: formData.birthYear,
        targetYear: formData.targetYear,
      });
      break;

    case 'name-detail':
    case 'name-change':
      validationResults = validateNameForm({
        name: formData.name,
        birthYear: formData.birthYear,
        birthMonth: formData.birthMonth,
        birthDay: formData.birthDay,
      });
      break;

    case 'marriage':
    case 'pre-marriage':
    case 'marriage-calculation':
    case 'peach-blossom':
      validationResults = validateMarriageForm({
        person1: formData.person1,
        person2: formData.person2,
      });
      break;

    default:
      validationResults = [];
  }

  // 👇 检查验证结果
  const { valid, errors: validationErrors } = checkValidationResults(validationResults);

  if (!valid) {
    // 显示错误
    setErrors(validationErrors);
    return; // 阻止提交
  }

  // 👇 验证通过，继续提交
  setLoading(true);
  setResult(null);

  try {
    let data;
    switch (type) {
      case 'birth-animal':
      case 'life-fortune':
      case 'year-2025':
      case 'zodiac-2025':
        data = await getBirthFortune({
          birthYear: formData.birthYear,
          birthMonth: formData.birthMonth,
          birthDay: formData.birthDay,
          birthHour: formData.birthHour,
        });
        break;

      case 'bazi':
      case 'career':
        data = await getBaziAnalysis({
          birthYear: formData.birthYear,
          birthMonth: formData.birthMonth,
          birthDay: formData.birthDay,
          birthHour: formData.birthHour,
          gender: formData.gender,
        });
        break;

      case 'flow-year':
        data = await getFlowYearFortune({
          birthYear: formData.birthYear,
          targetYear: formData.targetYear,
        });
        break;

      case 'name-detail':
      case 'name-change':
        data = await getNameAnalysis({
          name: formData.name,
          birthYear: formData.birthYear,
          birthMonth: formData.birthMonth,
          birthDay: formData.birthDay,
        });
        break;

      case 'marriage':
      case 'pre-marriage':
      case 'marriage-calculation':
      case 'peach-blossom':
        data = await getMarriageAnalysis({
          person1: formData.person1,
          person2: formData.person2,
        });
        break;

      default:
        throw new Error('未知的测算类型');
    }

    setResult(data);
  } catch (error) {
    console.error('测算失败:', error);
    setErrors(['服务器错误，请稍后再试']);
  } finally {
    setLoading(false);
  }
};
```

---

## 4. 在表单上方显示错误信息

```tsx
return (
  <div className="fortune-detail">
    <div className="fortune-detail-header">
      <button className="back-button" onClick={() => navigate('/')}>
        ← 返回
      </button>
      <h1>{titles[type || ''] || '算命测算'}</h1>
    </div>

    <div className="fortune-detail-content">
      {/* 👇 显示验证错误 */}
      {errors.length > 0 && (
        <div className="error-box">
          <h3>⚠️ 请修正以下错误:</h3>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="fortune-form">
        {/* ... 表单字段 ... */}
      </form>

      {/* ... 结果展示 ... */}
    </div>
  </div>
);
```

---

## 5. 添加错误样式 (FortuneDetail.css)

```css
/* 错误提示框 */
.error-box {
  background-color: #fee;
  border: 2px solid #fcc;
  border-radius: 8px;
  padding: 15px 20px;
  margin-bottom: 20px;
}

.error-box h3 {
  color: #c33;
  margin: 0 0 10px 0;
  font-size: 16px;
}

.error-box ul {
  margin: 0;
  padding-left: 20px;
}

.error-box li {
  color: #c33;
  margin: 5px 0;
}

/* 表单输入框错误状态 */
.form-input.error {
  border-color: #f44;
  background-color: #fff5f5;
}

.form-input.error:focus {
  outline-color: #f44;
  box-shadow: 0 0 0 3px rgba(255, 68, 68, 0.1);
}
```

---

## 6. 实时验证（可选）

如果想要在用户输入时实时显示错误，可以添加 onChange 验证：

```typescript
const handleInputChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));

  // 清除该字段相关的错误
  setErrors(prev => prev.filter(error => !error.includes(field)));
};

// 在输入框中使用
<input
  type="number"
  value={formData.birthYear}
  onChange={(e) => handleInputChange('birthYear', parseInt(e.target.value))}
  className="form-input"
  placeholder="如：1990"
/>
```

---

## 7. 完整示例（验证年份）

```tsx
// 年份输入框
<div className="form-group">
  <label>出生年份 *</label>
  <input
    type="number"
    value={formData.birthYear}
    onChange={(e) => {
      const year = parseInt(e.target.value);
      setFormData(prev => ({ ...prev, birthYear: year }));

      // 实时验证
      const result = validateYear(year);
      if (!result.valid && result.message) {
        setErrors([result.message]);
      } else {
        setErrors([]);
      }
    }}
    className={`form-input ${errors.some(e => e.includes('年份')) ? 'error' : ''}`}
    placeholder="如：1990"
    min="1900"
    max="2100"
  />
  {errors.some(e => e.includes('年份')) && (
    <span className="field-error">{errors.find(e => e.includes('年份'))}</span>
  )}
</div>
```

---

## 验证效果展示

### 验证通过 ✅
```
表单提交 → 验证通过 → 调用API → 显示结果
```

### 验证失败 ❌
```
表单提交 → 验证失败 → 显示错误信息 → 阻止提交

错误示例:
⚠️ 请修正以下错误:
• 年份必须在1900-2100之间
• 日期必须在1-31之间
• 请输入姓名
```

---

## 测试建议

### 1. 边界值测试
- 年份: 1899, 1900, 2100, 2101
- 月份: 0, 1, 12, 13
- 日期: 0, 1, 31, 32
- 时辰: -1, 0, 23, 24

### 2. 闰年测试
- 2000年2月29日 ✅ (闰年)
- 2001年2月29日 ❌ (非闰年)
- 2024年2月29日 ✅ (闰年)

### 3. 姓名测试
- "" ❌ (空字符串)
- "张" ❌ (少于2个字符)
- "张三" ✅
- "张三李四王五赵六孙七周八吴九郑十钱十一" ❌ (超过20个字符)
- "张三123" ❌ (包含非法字符)
- "Zhang San" ✅ (英文姓名)

### 4. 性别测试
- "" ❌ (空)
- "男" ✅
- "女" ✅
- "其他" ❌ (非法值)

---

## 下一步优化

1. **前端表单验证** ✅ 已完成
2. **后端数据验证** ⏳ 待添加
3. **更友好的错误提示** ⏳ 可以添加字段级错误提示
4. **实时验证** ⏳ 可选功能
5. **验证动画** ⏳ 添加错误抖动动画

---

**创建时间**: 2025-11-12
**状态**: 已完成
**下一步**: 集成到实际页面中
