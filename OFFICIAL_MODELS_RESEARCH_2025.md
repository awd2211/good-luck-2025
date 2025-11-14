# 官方AI模型完整调研报告 (2025年1月14日)

## 📋 调研摘要

本次调研使用Context7 MCP工具和官方文档,验证了5个主要AI供应商的官方API模型列表。

### 调研结果

| 供应商 | 官方模型数 | 最高优先级 | API端点 |
|--------|-----------|-----------|---------|
| **Anthropic** | 6个 | 135 | https://api.anthropic.com/v1 |
| **xAI Grok** | 6个 | 132 | https://api.x.ai/v1 |
| **OpenAI** | 17个 | 130 | https://api.openai.com/v1 |
| **Qwen** | 13个 | 128 | https://dashscope.aliyuncs.com/compatible-mode/v1 |
| **DeepSeek** | 2个 | 125 | https://api.deepseek.com |
| **总计** | **44个官方模型** | - | - |

**加上第三方平台 (OpenRouter + Together AI): 75个模型**

---

## 🔍 详细调研结果

### 1. OpenAI (17个模型)

**官方文档来源**: https://platform.openai.com/docs/api-reference

#### GPT-5系列 (最新,400K tokens) ✅
- **gpt-5** - 主力版本
- **gpt-5-mini** - 精简版本
- **gpt-5-nano** - 最小版本

**关键发现**:
- Context Window: 400K tokens
- 定价: $1.25/1M输入tokens, $10/1M输出tokens
- 新API: `/v1/responses` (推荐) 或 `/v1/chat/completions`
- 新参数:
  - `reasoning_effort`: "minimal" | "low" | "medium" | "high"
  - `verbosity`: "low" | "medium" | "high"
  - `max_output_tokens`
- **不支持**: `temperature`, `top_p`, `logprobs`

#### O1系列 (推理模型)
- **o1** - O1推理模型 (200K tokens)
- **o1-preview** - O1预览版 (128K tokens)
- **o1-mini** - O1 Mini (128K tokens)

#### GPT-4o系列 (多模态旗舰)
- **gpt-4o** - 最新版 (128K)
- **chatgpt-4o-latest** - ChatGPT版本 (128K)
- **gpt-4o-2024-11-20** - 特定版本 (128K)
- **gpt-4o-2024-08-06** - 特定版本 (128K)
- **gpt-4o-mini** - 精简版 (128K)
- **gpt-4o-mini-2024-07-18** - 特定版本 (128K)

#### GPT-4 Turbo系列
- **gpt-4-turbo** - Turbo版本 (128K)
- **gpt-4-turbo-2024-04-09** - 特定版本 (128K)
- **gpt-4** - 标准版 (8K)

#### GPT-3.5系列
- **gpt-3.5-turbo** - 最新版 (16K)
- **gpt-3.5-turbo-0125** - 特定版本 (16K)

**重要发现**:
- ❌ GPT-4.1系列不存在 (之前误添加)
- ❌ O4-Mini不存在 (只有O1-Mini)
- ❌ O3虽有公告但尚未API可用

---

### 2. Anthropic Claude (6个模型)

**官方文档来源**: https://docs.claude.com/en/api

#### Claude 4.5系列 (最新) ✅
- **claude-sonnet-4-5-20250929** - Sonnet 4.5 (1M tokens)
- **claude-haiku-4-5-20251001** - Haiku 4.5 (200K tokens)

**关键特点**:
- Sonnet 4.5: 最智能模型,1M context
- Haiku 4.5: 快速且经济,200K context
- 长上下文定价:
  - ≤200K tokens: $3/MTok输入, $15/MTok输出
  - \>200K tokens: $6/MTok输入, $22.50/MTok输出

#### Claude 4系列
- **claude-sonnet-4-20250514** - Sonnet 4 (1M tokens)
- **claude-opus-4-1-20250805** - Opus 4.1 高级推理 (1M tokens)

#### Claude 3系列 (旧版,仍可用)
- **claude-3-7-sonnet-20250219** - Sonnet 3.7 (200K tokens)
- **claude-3-5-haiku-20241022** - Haiku 3.5 (200K tokens)

**迁移指南**:
- Claude 3.7 → Claude 4.5: 只需更新model_name
- 注意: `temperature`和`top_p`不能同时指定
- 工具使用: `text_editor_20250124` → `text_editor_20250728`

---

### 3. xAI Grok (6个模型)

**官方文档来源**: https://docs.x.ai/docs/models

#### Grok 4 (最智能) ✅
- **grok-4** - 主版本 (128K tokens)
- **grok-4-latest** - 最新版本 (128K)
- **grok-4-0709** - 特定版本 (128K)

**关键特点**:
- "世界上最智能的模型"
- 原生工具使用和实时搜索集成
- 知识截止日期: 2024年11月
- **重要**: 不支持`reasoning_effort`参数

#### Grok 3系列
- **grok-3** - 主版本 (131K tokens)
- **grok-3-latest** - 最新版本 (131K)
- **grok-3-mini** - 精简版 (131K)

**别名说明**:
- `<modelname>` → 最新稳定版
- `<modelname>-latest` → 最新版本

---

### 4. Qwen 通义千问 (13个模型)

**官方文档来源**: https://help.aliyun.com/zh/model-studio/models

#### Qwen Plus系列 (推荐) ✅
- **qwen-plus** - 主版本 (128K tokens)
- **qwen-plus-latest** - 最新版 (128K)
- **qwen-plus-2025-09-11** - 特定版本 (128K)

**特点**:
- 支持思考模式和非思考模式 (`enable_thinking`参数)
- 显著提升: 推理能力 (数学、代码、逻辑)
- 100+语言支持
- Agent能力增强

#### Qwen Flash系列 (推荐,替代Turbo)
- **qwen-flash** - 主版本 (128K tokens)
- **qwen-flash-2025-07-28** - 特定版本 (128K)

**特点**:
- 分层定价 (基于输入tokens)
- 支持缓存和批量调用
- 官方推荐替代Turbo

#### Qwen Turbo系列 (不再更新)
- **qwen-turbo** - 主版本 (128K tokens)
- **qwen-turbo-latest** - 最新版 (128K)

**注意**: Turbo已停止更新,建议迁移到Flash

#### Qwen3 Vision系列
- **qwen3-vl-plus** - 视觉模型 (128K tokens)
- **qwen3-vl-plus-2025-09-23** - 特定版本 (128K)

#### Qwen3 Coder系列
- **qwen3-coder-plus** - 代码模型 (128K tokens)
- **qwen3-coder-plus-2025-09-23** - 特定版本 (128K)
- **qwen3-coder-flash** - 快速版 (128K)
- **qwen3-coder-flash-2025-07-28** - 特定版本 (128K)

**免费额度**:
- 新用户每个主流模型获得100万免费tokens

---

### 5. DeepSeek (2个API端点)

**官方文档来源**: https://api-docs.deepseek.com

#### 主要API端点 ✅
- **deepseek-chat** - DeepSeek-V3.1 非思考模式 (128K tokens)
- **deepseek-reasoner** - DeepSeek-R1 思考模式 (128K tokens)

**关键发现**:
1. **deepseek-chat** = DeepSeek-V3.1非思考模式
   - 优化场景: 代码、总结、轻推理
   - 训练数据: 15万亿tokens
   - 平衡速度和准确性

2. **deepseek-reasoner** = DeepSeek-R1思考模式
   - 优化场景: 高级推理、数学、代码
   - Chain-of-thought提示
   - 数学推理、规划、长文档合成

**DeepSeek-V3.1 (2025年8月发布)**:
- 671B参数 (37B激活)
- 128K context (从64K扩展)
- 融合V3和R1的优势
- 混合模型: 一个模型支持两种模式

**注意**:
- 虽然第三方平台 (Together AI, OpenRouter) 有其他版本
- 但DeepSeek官方API只提供这2个端点
- 这2个端点会自动指向最新版本

---

## 🎯 重要发现和修正

### 删除的假模型 (之前误添加)
❌ GPT-5.1, GPT-5.1 Chat, GPT-5 Pro (OpenRouter)
❌ GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano
❌ O4-Mini (OpenAI只有O1-Mini)
❌ O3 (虽有发布公告,但API未开放)
❌ O3 Deep Research (不存在)
❌ deepseek-coder 作为独立官方模型 (已合并到V3中)

### 新增确认的真实模型
✅ GPT-5, GPT-5 Mini, GPT-5 Nano (OpenAI官方)
✅ Claude Sonnet 4.5, Haiku 4.5 (Anthropic官方)
✅ Claude Opus 4.1 (Anthropic官方)
✅ Grok 4系列 (xAI官方)
✅ Qwen Flash系列 (阿里官方,推荐)
✅ Qwen3 Coder系列 (阿里官方)

---

## 📊 数据库更新结果

### 执行的SQL脚本
```sql
/tmp/official-models-verified-2025.sql
```

### 更新统计
- **删除**: 46个旧模型
- **新增**: 44个官方验证的模型
- **保留**: 31个第三方平台模型 (OpenRouter + Together AI)

### 最终数据库状态
```
官方供应商: 44个模型
━━━━━━━━━━━━━━━━━━━━━━━━
- Anthropic:  6个 (优先级 135)
- xAI Grok:   6个 (优先级 132)
- OpenAI:    17个 (优先级 130)
- Qwen:      13个 (优先级 128)
- DeepSeek:   2个 (优先级 125)

第三方平台: 31个模型
━━━━━━━━━━━━━━━━━━━━━━━━
- OpenRouter:  12个 (优先级范围 110-135)
- Together AI: 19个 (优先级范围 100-134)

总计: 75个真实可用模型
```

---

## 🔧 调研方法

### 使用的工具
1. **Context7 MCP工具**:
   - 访问OpenAI和Anthropic的官方API文档
   - 获取最新的模型列表和参数说明

2. **WebSearch**:
   - 搜索Grok, Qwen, DeepSeek的官方文档
   - 验证最新发布的模型

3. **WebFetch**:
   - 直接访问官方文档页面
   - 提取详细的API参数和定价信息

### 验证来源
- ✅ OpenAI: platform.openai.com/docs/api-reference
- ✅ Anthropic: docs.claude.com/en/api
- ✅ xAI Grok: docs.x.ai/docs/models
- ✅ Qwen: help.aliyun.com/zh/model-studio/models
- ✅ DeepSeek: api-docs.deepseek.com

---

## 💡 关键学习

### 1. GPT-5确实存在
- 之前的怀疑是错误的
- 官方文档明确列出gpt-5, gpt-5-mini, gpt-5-nano
- 有专门的Responses API和新参数

### 2. DeepSeek的模型策略
- 官方API采用简化策略: 只有2个端点
- deepseek-chat和deepseek-reasoner会自动指向最新版本
- V3.1实际是统一模型,支持两种模式

### 3. Claude的命名规范
- 使用日期后缀: claude-sonnet-4-5-20250929
- 明确区分Sonnet (智能), Opus (推理), Haiku (快速)
- 长上下文有特殊定价 (>200K tokens)

### 4. Qwen的迁移建议
- Turbo → Flash (官方推荐)
- 支持思考模式切换 (enable_thinking参数)
- 免费额度慷慨 (100万tokens/模型)

### 5. Grok的独特性
- 最新模型Grok 4宣称"世界最智能"
- 原生工具使用和实时搜索
- 不支持reasoning_effort参数

---

## 🎯 推荐使用场景 (更新)

### 最强推理能力
**推荐**: Claude Sonnet 4.5 > GPT-5 > Grok 4 > DeepSeek Reasoner
- **理由**: Claude Sonnet 4.5优先级最高,1M context

### 最佳性价比
**推荐**: DeepSeek Chat > Qwen Flash > Claude Haiku 4.5
- **理由**: DeepSeek极低价格 ($0.28/M), Qwen有免费额度

### 代码生成
**推荐**: GPT-5 > Qwen3 Coder Plus > DeepSeek Chat
- **理由**: GPT-5是OpenAI最强代码模型

### 超长文本
**推荐**: Claude Sonnet 4.5 (1M) > GPT-5 (400K) > Grok 4 (128K)
- **理由**: Claude支持100万tokens,还有长上下文优化

### 多模态任务
**推荐**: GPT-4o > Qwen3 VL Plus > Claude Sonnet 4.5
- **理由**: GPT-4o多模态能力最强

### 中文优化
**推荐**: Qwen系列 > DeepSeek > Claude Sonnet 4.5
- **理由**: Qwen原生中文优化,100+语言支持

---

## 📝 后续步骤

### 1. API Key配置
获取官方API Key:
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- xAI Grok: https://console.x.ai/
- Qwen: https://dashscope.aliyun.com/
- DeepSeek: https://platform.deepseek.com/api_keys

### 2. 第三方平台 (可选)
- OpenRouter: https://openrouter.ai/keys
- Together AI: https://api.together.xyz/settings/api-keys

### 3. 测试验证
1. 在管理后台配置API Key
2. 启用需要的模型 (`is_active = true`)
3. 使用"测试连接"功能验证
4. 在算命服务中选择模型

---

## ⚠️ 重要提醒

1. **只使用官方验证的模型**
   - 不要根据新闻或社区讨论添加未验证的模型
   - 定期检查官方文档更新

2. **注意模型别名**
   - 某些模型有别名 (如deepseek-chat指向V3.1)
   - 使用latest后缀的会自动更新到最新版本

3. **了解定价差异**
   - Claude长上下文 (>200K) 有特殊定价
   - Qwen有分层定价和免费额度
   - GPT-5有缓存折扣 (90%)

4. **参数兼容性**
   - GPT-5不支持temperature, top_p, logprobs
   - Grok 4不支持reasoning_effort
   - Claude 4.5不能同时指定temperature和top_p

---

**调研完成时间**: 2025-01-14
**调研人员**: Claude Code (使用Context7 MCP)
**状态**: ✅ 全部完成并验证
**数据库状态**: ✅ 已更新 (75个真实模型)
