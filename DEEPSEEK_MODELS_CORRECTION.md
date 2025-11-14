# DeepSeek模型列表修正报告

## 🔍 问题发现

之前添加了3个DeepSeek模型,但根据官方API文档,DeepSeek只有**2个官方模型**。

## ✅ 官方模型列表 (来自 api-docs.deepseek.com)

根据DeepSeek官方API文档 (https://api-docs.deepseek.com),只有以下2个模型:

### 1. deepseek-chat
- **版本**: DeepSeek-V3.2-Exp (非思考模式)
- **Context长度**: 128K tokens
- **最大输出**: 默认4K, 最大8K tokens
- **功能**: JSON输出, 函数调用, 聊天前缀补全, FIM补全
- **定价**:
  - 输入: $0.028/1M tokens (缓存命中)
  - 输入: $0.28/1M tokens (缓存未命中)
  - 输出: $0.42/1M tokens

### 2. deepseek-reasoner
- **版本**: DeepSeek-V3.2-Exp (思考模式)
- **Context长度**: 128K tokens
- **最大输出**: 默认32K, 最大64K tokens
- **功能**: JSON输出, 聊天前缀补全
- **定价**: 与deepseek-chat相同
- **特点**: 生成思维链(CoT)推理过程,提高准确性

### ⚠️ 重要说明

**关于deepseek-coder:**
- DeepSeek官方API文档中**没有**单独的 `deepseek-coder` 模型
- 之前的DeepSeek Coder已合并到DeepSeek-V2.5,然后升级到V3.1,现在是V3.2-Exp
- 代码生成能力已集成在 `deepseek-chat` 模型中

**关于函数调用:**
- 如果对 `deepseek-reasoner` 的请求包含 `tools` 参数,实际会使用 `deepseek-chat` 模型处理

---

## 🔧 修正操作

### 执行的SQL
```sql
-- 删除错误的deepseek-coder模型
DELETE FROM ai_models WHERE provider = 'deepseek' AND model_name = 'deepseek-coder';

-- 更新deepseek-chat模型信息
UPDATE ai_models
SET
  name = 'DeepSeek Chat (V3.2-Exp)',
  max_tokens = 128000,
  priority = 100,
  status = 'inactive'
WHERE provider = 'deepseek' AND model_name = 'deepseek-chat';

-- 更新deepseek-reasoner模型信息
UPDATE ai_models
SET
  name = 'DeepSeek Reasoner (V3.2-Exp)',
  max_tokens = 128000,
  priority = 105,
  status = 'inactive'
WHERE provider = 'deepseek' AND model_name = 'deepseek-reasoner';
```

### 修正结果
- ❌ 删除: `deepseek-coder` (不存在的模型)
- ✅ 保留: `deepseek-chat` - DeepSeek Chat (V3.2-Exp)
- ✅ 保留: `deepseek-reasoner` - DeepSeek Reasoner (V3.2-Exp)

---

## 📊 最终统计

### 修正前
- DeepSeek模型: 3个 ❌
- 总模型数: 39个

### 修正后
- DeepSeek模型: **2个** ✅
- 总模型数: **38个**

| 供应商 | 模型数量 |
|--------|---------|
| OpenAI | 16 |
| Grok | 7 |
| Qwen | 13 |
| **DeepSeek** | **2** ✅ |
| **总计** | **38** |

---

## 🧪 API测试验证

```bash
GET /api/manage/ai-models/by-provider/deepseek
```

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": 44,
      "model_name": "deepseek-reasoner",
      "name": "DeepSeek Reasoner (V3.2-Exp)",
      "status": "inactive",
      "max_tokens": 128000,
      "api_base_url": "https://api.deepseek.com"
    },
    {
      "id": 43,
      "model_name": "deepseek-chat",
      "name": "DeepSeek Chat (V3.2-Exp)",
      "status": "inactive",
      "max_tokens": 128000,
      "api_base_url": "https://api.deepseek.com"
    }
  ]
}
```

✅ API测试通过!

---

## 📚 参考文档

- **官方API文档**: https://api-docs.deepseek.com/
- **模型列表**: https://api-docs.deepseek.com/api/list-models
- **定价页面**: https://api-docs.deepseek.com/quick_start/pricing
- **推理模型指南**: https://api-docs.deepseek.com/guides/reasoning_model
- **V3.2发布公告**: https://api-docs.deepseek.com/news/news250929
- **R1发布公告**: https://api-docs.deepseek.com/news/news250120

---

## 💡 使用建议

### deepseek-chat 适用场景
- 日常对话
- 代码生成和调试
- 文本摘要
- 翻译
- 快速响应的场景

### deepseek-reasoner 适用场景
- 复杂数学问题
- 逻辑推理
- 多步骤规划
- 需要详细思考过程的任务
- 对准确性要求高的场景

### 性价比优势
DeepSeek是目前性价比最高的模型之一:
- **输入成本**: $0.28/1M tokens (约为GPT-4的1/100)
- **输出成本**: $0.42/1M tokens
- **性能**: 接近GPT-4水平
- **Context**: 128K tokens

---

## ✅ 修正完成

- ✅ 删除不存在的模型
- ✅ 更新模型版本信息
- ✅ API测试通过
- ✅ 文档更新完成

**更新时间**: 2025-01-14
**状态**: ✅ 已修正并验证
**数据来源**: DeepSeek官方API文档
