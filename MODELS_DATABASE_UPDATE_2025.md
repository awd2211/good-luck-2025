# AI模型数据库更新报告 (2025年1月14日)

## 📊 更新摘要

已成功从各厂商官方API文档和第三方平台搜索并导入**80个2025年最新模型**到数据库。

### 模型数量统计

| 供应商 | 模型数量 | 最新旗舰模型 |
|--------|---------|-------------|
| **OpenAI** | 16个 | O3, O4-Mini, GPT-4.1 |
| **Grok (xAI)** | 7个 | Grok 4, Grok 4 Fast (200万tokens) |
| **Qwen (阿里)** | 13个 | Qwen Long (1000万tokens), Qwen2.5-Max |
| **DeepSeek** | 9个 | DeepSeek R1-0528, V3.2-Exp |
| **OpenRouter** | 16个 | Claude Sonnet 4.5, GPT-5.1, Grok 4 Fast |
| **Together AI** | 19个 | Llama 4 Scout (512K), Qwen3 235B MoE |
| **总计** | **80个** | - |

---

## 🔍 模型详细列表

### OpenAI (16个模型)

#### O系列推理模型 (2025最新)
1. **o3** - O3 推理模型 (200K tokens) - Priority: 120
2. **o4-mini** - O4-Mini 推理模型 (200K tokens) - Priority: 115
3. **o1** - O1 推理模型 (200K tokens) - Priority: 108
4. **o1-mini** - O1 Mini (128K tokens) - Priority: 102

#### GPT-4.1 系列 (2025年4月 - 代码专家)
5. **gpt-4.1** - GPT-4.1 旗舰 (128K tokens) - Priority: 105
6. **gpt-4.1-mini** - GPT-4.1 Mini (128K tokens) - Priority: 88
7. **gpt-4.1-nano** - GPT-4.1 Nano (128K tokens) - Priority: 75

#### GPT-4o 系列 (多模态旗舰)
8. **gpt-4o** - GPT-4o 最新版 (128K tokens) - Priority: 100
9. **chatgpt-4o-latest** - ChatGPT-4o Latest (128K tokens) - Priority: 98
10. **gpt-4o-2024-11-20** - GPT-4o 2024-11-20 (128K tokens) - Priority: 95
11. **gpt-4o-2024-08-06** - GPT-4o 2024-08-06 (128K tokens) - Priority: 90
12. **gpt-4o-mini** - GPT-4o Mini (128K tokens) - Priority: 85
13. **gpt-4o-mini-2024-07-18** - GPT-4o Mini 2024-07-18 (128K tokens) - Priority: 80

#### GPT-4 经典系列
14. **gpt-4-turbo** - GPT-4 Turbo (128K tokens) - Priority: 92
15. **gpt-4** - GPT-4 标准版 (8K tokens) - Priority: 87

#### GPT-3.5 系列
16. **gpt-3.5-turbo** - GPT-3.5 Turbo (16K tokens) - Priority: 70

---

### Grok / xAI (7个模型)

#### Grok 4 系列 (2025年7-9月 - 全球最长context)
1. **grok-4** - Grok 4 旗舰 (⚡ **200万tokens**) - Priority: 120
2. **grok-4-heavy** - Grok 4 Heavy (200万tokens) - Priority: 118
3. **grok-4-fast** - Grok 4 Fast (200万tokens, 节省40%thinking tokens) - Priority: 115

#### Grok 3 系列
4. **grok-3** - Grok 3 (131K tokens) - Priority: 100
5. **grok-3-mini** - Grok 3 Mini (131K tokens) - Priority: 95

#### Grok 2 系列
6. **grok-2-1212** - Grok 2 1212 (131K tokens) - Priority: 90
7. **grok-2-latest** - Grok 2 Latest (131K tokens) - Priority: 88

---

### Qwen / 阿里通义千问 (13个模型)

#### 超长文本之王
1. **qwen-long** - Qwen Long 超长文本 (🔥 **1000万tokens**) - Priority: 125

#### Qwen2.5-Max 系列 (2025年1月)
2. **qwen-max** - Qwen2.5-Max 最新版 (32K tokens) - Priority: 120
3. **qwen-max-2025-01-25** - Qwen2.5-Max 2025-01-25 (32K tokens) - Priority: 118

#### Qwen3 系列 (2025年9月)
4. **qwen3-max** - Qwen3 Max (32K tokens) - Priority: 115
5. **qwen3-coder-plus-2025-09-23** - Qwen3 Coder Plus (32K tokens) - Priority: 110

#### Qwen Plus 系列 (128K)
6. **qwen-plus** - Qwen Plus 最新版 (128K tokens) - Priority: 105
7. **qwen-plus-latest** - Qwen Plus Latest (128K tokens) - Priority: 103

#### Qwen Fast 系列 (100万tokens)
8. **qwen-flash** - Qwen Flash 推荐 (100万tokens) - Priority: 98
9. **qwen-turbo** - Qwen Turbo (100万tokens) - Priority: 95

#### Qwen Coder 系列
10. **qwen2.5-coder-32b-instruct** - Qwen2.5 Coder 32B (32K tokens) - Priority: 93
11. **qwen-coder-turbo** - Qwen Coder Turbo (131K tokens) - Priority: 91

#### Qwen2.5 开源系列
12. **qwen2.5-72b-instruct** - Qwen2.5 72B (32K tokens) - Priority: 90
13. **qwen2.5-32b-instruct** - Qwen2.5 32B (32K tokens) - Priority: 88

---

### DeepSeek (9个模型)

#### 官方API模型 (2个端点)
1. **deepseek-chat** - DeepSeek Chat (当前最新) 非思考模式 (128K tokens) - Priority: 100
2. **deepseek-reasoner** - DeepSeek Reasoner (当前最新) 思考模式 (128K tokens) - Priority: 105

#### V3 系列 (4个版本)
3. **deepseek-chat-v3.2** - DeepSeek V3.2-Exp (128K tokens) - Priority: 98
4. **deepseek-chat-v3.1** - DeepSeek V3.1 混合模式 (128K tokens) - Priority: 96
5. **deepseek-v3-0324** - DeepSeek V3-0324 快速版 (128K tokens) - Priority: 94
6. **deepseek-v3** - DeepSeek V3 基础版 (128K tokens) - Priority: 92

#### R1 推理系列 (2个版本)
7. **deepseek-r1-0528** - DeepSeek R1-0528 推理增强 (128K tokens) - Priority: 103
8. **deepseek-r1** - DeepSeek R1 原始版 (128K tokens) - Priority: 101

#### Coder 系列
9. **deepseek-coder** - DeepSeek Coder V2 代码专用 (128K tokens) - Priority: 90

**注意**: 官方API有2个主要端点,但支持9个版本变体

---

### OpenRouter (16个模型)

#### 平台特点
**OpenRouter** 是统一API网关,提供访问200+模型的能力,支持自动路由和故障转移
- **API端点**: https://openrouter.ai/api/v1
- **兼容性**: OpenAI兼容接口
- **特色**: 一个API Key访问所有主流模型

#### OpenAI系列 (通过OpenRouter)
1. **openai/gpt-5.1** - GPT-5.1 (400K tokens) - Priority: 130
2. **openai/gpt-5.1-chat** - GPT-5.1 Chat (128K tokens) - Priority: 128
3. **openai/gpt-5-pro** - GPT-5 Pro (400K tokens) - Priority: 125
4. **openai/o3-deep-research** - O3 Deep Research (200K tokens) - Priority: 122

#### Claude系列 (通过OpenRouter)
5. **anthropic/claude-sonnet-4.5** - Claude Sonnet 4.5 (1M tokens) - Priority: 135
6. **anthropic/claude-haiku-4.5** - Claude Haiku 4.5 (200K tokens) - Priority: 132

#### Gemini系列 (通过OpenRouter)
7. **google/gemini-2.5-flash-preview-09-2025** - Gemini 2.5 Flash (1M tokens) - Priority: 118
8. **google/gemini-2.5-flash-lite-preview-09-2025** - Gemini 2.5 Flash Lite (1M tokens) - Priority: 115

#### Qwen系列 (通过OpenRouter)
9. **qwen/qwen3-max** - Qwen3 Max (256K tokens) - Priority: 127
10. **qwen/qwen3-coder-plus** - Qwen3 Coder Plus (128K tokens) - Priority: 124
11. **qwen/qwen3-vl-235b-a22b-instruct** - Qwen3 VL 235B (262K tokens) - Priority: 121

#### 其他供应商
12. **xai/grok-4-fast** - Grok 4 Fast (2M tokens) - Priority: 133
13. **amazon/nova-premier-1.0** - Amazon Nova Premier (1M tokens) - Priority: 119
14. **moonshotai/kimi-k2-0905** - Kimi K2 (256K tokens) - Priority: 116
15. **deepseek/deepseek-v3.1-terminus** - DeepSeek V3.1 Terminus (164K tokens) - Priority: 112
16. **mistralai/voxtral-small-24b-2507** - Voxtral Small (32K tokens) - Priority: 110

---

### Together AI (19个模型)

#### 平台特点
**Together AI** 提供200+开源和专业模型的快速推理平台
- **API端点**: https://api.together.xyz/v1
- **性能**: 4x faster than vLLM
- **特色**: 超高性价比,批量处理50%折扣

#### Meta Llama系列
1. **meta/llama-4-maverick** - Llama 4 Maverick (256K tokens) - Priority: 134
2. **meta/llama-4-scout** - Llama 4 Scout (512K tokens) - Priority: 130

#### DeepSeek系列 (通过Together AI)
3. **deepseek/deepseek-r1-0528** - DeepSeek R1-0528 (128K tokens) - Priority: 126
4. **deepseek/deepseek-v3-0324** - DeepSeek V3-0324 (128K tokens) - Priority: 123
5. **deepseek/deepseek-v3.1** - DeepSeek V3.1 (128K tokens) - Priority: 120
6. **deepseek/deepseek-v3.2-exp** - DeepSeek V3.2-Exp (128K tokens) - Priority: 117

#### Qwen系列 (通过Together AI)
7. **qwen/qwen3-235b-a22b-fp8** - Qwen3 235B MoE (128K tokens) - Priority: 131
8. **qwen/qwen3-235b-a22b-instruct-2507-fp8** - Qwen3 235B Instruct (262K tokens) - Priority: 129
9. **qwen/qwen2.5-coder-32b** - Qwen 2.5-Coder 32B (128K tokens) - Priority: 114
10. **qwen/qwen3-coder-480b-a35b** - Qwen3-Coder 480B (256K tokens) - Priority: 113
11. **qwen/qwen3-next-80b-a3b** - Qwen3-Next 80B (128K tokens) - Priority: 108

#### 其他模型
12. **moonshotai/kimi-k2-instruct-0905** - Kimi K2 Instruct (256K tokens) - Priority: 125
13. **google/gemma-3-27b** - Gemma 3 27B (128K tokens) - Priority: 111
14. **zai/glm-4.6** - GLM-4.6 (200K tokens) - Priority: 109
15. **zai/glm-4.5-air** - GLM-4.5-Air (128K tokens) - Priority: 107
16. **mistralai/mistral-small-3** - Mistral Small 3 (128K tokens) - Priority: 106
17. **minimaxai/minimax-m1-40k** - MiniMax M1 40K (1M tokens) - Priority: 104
18. **openai/gpt-oss-120b** - GPT-OSS 120B (128K tokens) - Priority: 103
19. **servicenow/apriel-1.5-15b-thinker** - Apriel 1.5 Thinker 免费 (131K tokens) - Priority: 100

---

## 📈 Context Window 排行榜

| 排名 | 模型 | Context Window | 供应商 |
|------|------|----------------|--------|
| 🥇 | Qwen Long | **1000万tokens** | Qwen |
| 🥈 | Grok 4 系列 | **200万tokens** | Grok/OpenRouter |
| 🥉 | Qwen Flash/Turbo | **100万tokens** | Qwen |
| 4 | Claude Sonnet 4.5 | **100万tokens** | OpenRouter |
| 5 | Gemini 2.5 系列 | **100万tokens** | OpenRouter |
| 6 | MiniMax M1 | **100万tokens** | Together AI |
| 7 | Amazon Nova Premier | **100万tokens** | OpenRouter |
| 8 | Together Llama 4 Scout | **51.2万tokens** | Together AI |
| 9 | GPT-5.1 | **40万tokens** | OpenRouter |
| 10 | Qwen3 235B Instruct | **26.2万tokens** | Together AI |

---

## 🎯 推荐使用场景

### 日常对话 & 客服
**推荐**: DeepSeek Chat > Claude Haiku 4.5 (OpenRouter) > GPT-4o-mini
- **理由**: 性价比高,响应快速,Claude Haiku质量更好

### 代码生成 & 调试
**推荐**: Qwen3 Coder Plus > DeepSeek Chat > GPT-4.1
- **理由**: Qwen Coder系列专为代码优化,480B版本更强大

### 复杂推理 & 数学
**推荐**: DeepSeek R1-0528 > O3 (OpenRouter) > Claude Sonnet 4.5
- **理由**: DeepSeek R1在数学和推理上已达到顶级水平

### 超长文本处理
**推荐**: Qwen Long (1000万) > Grok 4 Fast (200万) > Llama 4 Scout (512K)
- **理由**: Qwen Long处理超长文档无敌,Llama 4 Scout开源最强

### 多模态任务
**推荐**: Gemini 2.5 Flash (OpenRouter) > GPT-4o > Qwen3 VL 235B
- **理由**: Gemini 2.5多模态能力强且价格极低

### 需要多供应商切换
**推荐**: 使用OpenRouter平台
- **理由**: 一个API Key访问所有模型,自动故障转移

### 开源模型优先
**推荐**: 使用Together AI平台
- **理由**: Llama 4, GLM, Gemma等开源模型,性价比极高

### 预算有限
**推荐**: DeepSeek系列 > Together AI免费层 > Gemini 2.5 Flash Lite
- **理由**: DeepSeek最便宜($0.28/M),Together AI有免费模型

---

## 💡 重要说明

### 1. API Key配置
所有模型都使用占位符API Key: `sk-需要配置` 或 `xai-需要配置`

**您需要在管理后台**:
1. 进入 "AI模型管理"
2. 编辑对应模型
3. 填入真实的API Key
4. 设置 `is_active = true` 启用模型
5. 测试连接

### 2. 模型状态
- **status**: 所有模型初始状态为 `inactive`
- **is_active**: 所有模型初始为 `false` (未启用)
- 需要配置API Key后手动启用

### 3. 优先级说明
- Priority值越高,在智能路由中优先级越高
- 最高: Qwen Long (125)
- O3: 120, Grok 4: 120
- 最低: GPT-3.5 Turbo (70)

---

## 🔧 数据来源

### 搜索来源
1. **OpenAI**: 官方网站 + 2025年发布公告
2. **Grok (xAI)**: x.ai官方文档 + API文档
3. **Qwen**: 阿里云Model Studio官方文档
4. **DeepSeek**: 官方API文档 + OpenRouter + Together AI平台
5. **OpenRouter**: https://openrouter.ai/models + API文档
6. **Together AI**: https://www.together.ai/models + API文档

### API端点
- **OpenAI**: `https://api.openai.com/v1`
- **Grok**: `https://api.x.ai/v1`
- **Qwen**: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **DeepSeek**: `https://api.deepseek.com`
- **OpenRouter**: `https://openrouter.ai/api/v1`
- **Together AI**: `https://api.together.xyz/v1`

---

## ✅ 测试验证

### API端点测试
所有6个供应商的 `/api/manage/ai-models/by-provider/:provider` 端点均已测试通过:

```bash
✅ OpenAI: 16个模型正确返回
✅ Grok: 7个模型正确返回
✅ Qwen: 13个模型正确返回
✅ DeepSeek: 9个模型正确返回
✅ OpenRouter: 16个模型正确返回
✅ Together AI: 19个模型正确返回
```

### 前端集成测试
1. 打开管理后台: http://localhost:53004/
2. 进入 "AI模型管理"
3. 点击 "新增模型"
4. 选择供应商 (支持6个供应商):
   - openai (16个模型)
   - grok (7个模型)
   - qwen (13个模型)
   - deepseek (9个模型)
   - **openrouter** (16个模型,包含Claude, GPT-5等)
   - **together** (19个模型,包含Llama 4等)
5. 模型标识下拉框会自动加载该供应商的所有模型

---

## 📝 SQL脚本

完整的SQL脚本已保存在: `/tmp/update-models-2025.sql`

可重新执行导入:
```bash
docker cp /tmp/update-models-2025.sql fortune-postgres:/tmp/
docker exec fortune-postgres psql -U fortune_user -d fortune_db -f /tmp/update-models-2025.sql
```

---

## 🎉 更新完成

### 完成状态
- ✅ 搜索各厂家最新官方模型列表
- ✅ 清理数据库现有模型 (删除5个旧模型)
- ✅ 添加OpenAI最新模型 (16个)
- ✅ 添加Grok最新模型 (7个)
- ✅ 添加Qwen最新模型 (13个)
- ✅ 添加DeepSeek最新模型 (9个) - 包含所有版本变体
- ✅ **添加OpenRouter平台模型 (16个)** - 统一访问接口
- ✅ **添加Together AI平台模型 (19个)** - 开源模型平台
- ✅ 验证数据库和API (全部通过)

### 数据库状态
- **总模型数**: **80个** (之前: 5个)
- **供应商**: **6个** (官方4个 + 第三方平台2个)
- **状态**: 所有模型已导入,等待配置API Key

### DeepSeek完整列表说明
根据官方API和第三方平台验证,DeepSeek有9个模型版本:
- ✅ deepseek-chat (主端点,指向最新版本)
- ✅ deepseek-reasoner (推理端点,指向最新R1)
- ✅ V3系列: v3.2, v3.1, v3-0324, v3
- ✅ R1系列: r1-0528, r1
- ✅ Coder: deepseek-coder

详见: `/tmp/update-deepseek-complete.sql`

---

## 🚀 下一步操作

### 1. 获取API Key
根据需要从各供应商获取API Key:

**官方供应商:**
- OpenAI: https://platform.openai.com/api-keys
- Grok (xAI): https://console.x.ai/
- Qwen: https://dashscope.aliyun.com/
- DeepSeek: https://platform.deepseek.com/api_keys

**第三方平台 (推荐):**
- **OpenRouter**: https://openrouter.ai/keys - 一个Key访问所有模型
- **Together AI**: https://api.together.xyz/settings/api-keys - 开源模型专用

### 2. 配置模型
1. 打开管理后台: http://localhost:53004/
2. 进入 "AI模型管理"
3. 选择要配置的模型
4. 填入API Key
5. 设置 `is_active = true`
6. 点击"测试连接"验证

### 3. 开始使用
在算命服务配置中选择已启用的AI模型即可开始使用

---

**更新时间**: 2025-01-14
**执行者**: Claude Code
**状态**: ✅ 全部完成
