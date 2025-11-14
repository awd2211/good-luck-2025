# 数据库驱动的模型选择器更新

## 🎯 问题描述
之前模型名称(model_name)字段使用硬编码的 `modelPresets` 对象,不是从数据库读取。

## ✅ 解决方案
将模型选择器改为从数据库动态获取模型列表。

---

## 📝 实现细节

### 1. 后端API (`backend/`)

#### 新增控制器 (`src/controllers/aiModels.ts`)
```typescript
/**
 * 按供应商获取AI模型（用于下拉选择）
 */
export const getAIModelsByProvider = async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;

    const result = await query(
      `SELECT id, model_name, name, status, max_tokens, api_base_url
       FROM ai_models
       WHERE provider = $1
       ORDER BY priority DESC, created_at DESC`,
      [provider]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('获取供应商模型列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取供应商模型列表失败',
      error: error.message
    });
  }
};
```

#### 新增路由 (`src/routes/aiModels.ts`)
```typescript
// 按供应商获取AI模型（需要读取权限）- 用于下拉选择
router.get(
  '/by-provider/:provider',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.READ),
  getAIModelsByProvider
);
```

**API端点**: `GET /api/manage/ai-models/by-provider/:provider`

**示例请求**:
```bash
curl http://localhost:50301/api/manage/ai-models/by-provider/grok \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**示例响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "model_name": "grok-beta",
      "name": "Grok Beta",
      "status": "active",
      "max_tokens": 2000,
      "api_base_url": "https://api.x.ai/v1"
    }
  ]
}
```

---

### 2. 前端更新 (`admin-frontend/src/pages/AIModelManagement.tsx`)

#### 新增状态
```typescript
// 9. 从数据库获取的供应商模型列表
const [providerModels, setProviderModels] = useState<AIModel[]>([])
const [providerModelsLoading, setProviderModelsLoading] = useState(false)
```

#### 更新 `handleProviderChange`
```typescript
const handleProviderChange = async (provider: string) => {
  console.log('供应商变化:', provider)
  setSelectedProvider(provider)

  // 清空模型名称
  form.setFieldsValue({
    model_name: undefined,
    api_base_url: provider === 'openai' ? 'https://api.openai.com/v1' :
                  provider === 'grok' ? 'https://api.x.ai/v1' :
                  provider === 'qwen' ? 'https://dashscope.aliyuncs.com/api/v1' :
                  provider === 'deepseek' ? 'https://api.deepseek.com' : ''
  })

  // 从数据库获取该供应商的所有模型
  if (provider) {
    try {
      setProviderModelsLoading(true)
      const response = await api.get(`/ai-models/by-provider/${provider}`)
      console.log('从数据库获取的模型:', response.data.data)
      setProviderModels(response.data.data || [])
    } catch (error: any) {
      console.error('获取供应商模型失败:', error)
      message.error(error.response?.data?.message || '获取模型列表失败')
      setProviderModels([])
    } finally {
      setProviderModelsLoading(false)
    }
  } else {
    setProviderModels([])
  }
}
```

#### 更新 `handleOpenModal`
```typescript
const handleOpenModal = async (model?: AIModel) => {
  if (model) {
    setEditingModel(model)
    setSelectedProvider(model.provider)
    form.setFieldsValue(model)

    // 加载该供应商的模型列表
    try {
      setProviderModelsLoading(true)
      const response = await api.get(`/ai-models/by-provider/${model.provider}`)
      setProviderModels(response.data.data || [])
    } catch (error: any) {
      console.error('获取供应商模型失败:', error)
      setProviderModels([])
    } finally {
      setProviderModelsLoading(false)
    }
  } else {
    setEditingModel(null)
    setSelectedProvider('')
    setProviderModels([]) // 清空模型列表
    form.resetFields()
    // ...
  }
  setModalVisible(true)
}
```

#### 更新 `handleModelNameChange`
```typescript
const handleModelNameChange = (modelName: string) => {
  // 优先从数据库模型中查找
  const dbModel = providerModels.find(m => m.model_name === modelName)

  if (dbModel) {
    // 如果在数据库中找到，使用数据库的配置
    form.setFieldsValue({
      api_base_url: dbModel.api_base_url,
      max_tokens: dbModel.max_tokens,
    })
  } else {
    // 如果是新模型，尝试从预设中获取默认配置
    const provider = form.getFieldValue('provider')
    const preset = modelPresets[provider]?.[modelName]

    if (preset) {
      form.setFieldsValue({
        api_base_url: preset.api_base_url,
        max_tokens: preset.max_tokens,
      })
    }
  }
}
```

#### 更新 Select 组件
```tsx
<Select
  showSearch
  placeholder="选择数据库中已有的模型或输入新模型名"
  optionFilterProp="children"
  onChange={handleModelNameChange}
  filterOption={(input, option) =>
    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
  }
  dropdownRender={(menu) => (
    <>
      {menu}
      <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
        <small style={{ color: '#999' }}>
          {selectedProvider
            ? `当前供应商: ${selectedProvider}, 数据库模型数量: ${providerModels.length}`
            : '提示：先选择供应商，可选择已有模型或输入新模型名'
          }
        </small>
      </div>
    </>
  )}
  disabled={!selectedProvider}
  loading={providerModelsLoading}
  notFoundContent={
    providerModelsLoading ? <Spin size="small" /> :
    !selectedProvider ? '请先选择供应商' :
    providerModels.length === 0 ? '该供应商暂无模型，可输入新模型名' : '未找到匹配的模型'
  }
>
  {providerModels.map((model) => (
    <Option key={model.id} value={model.model_name}>
      {model.model_name} - {model.name} {model.status === 'active' ? '✓' : ''}
    </Option>
  ))}
</Select>
```

---

## 🎯 使用流程

### 创建新模型
1. 点击 "新增模型"
2. 选择 **供应商** (如: Grok)
3. 系统自动从数据库加载该供应商的所有模型
4. 在 **模型标识** 下拉框中:
   - 如果数据库有模型: 显示模型列表供选择 (如: grok-beta)
   - 如果数据库无模型: 提示"该供应商暂无模型,可输入新模型名"
5. 选择或输入模型名后,自动填充配置
6. 填写API Key等其他信息
7. 保存

### 编辑现有模型
1. 点击模型的 "编辑" 按钮
2. 系统自动加载该供应商的所有模型
3. 可在下拉框中切换到同供应商的其他模型
4. 保存

---

## 📊 当前数据库状态

根据测试,数据库中有5个模型:

| 供应商 | 模型数量 | 模型列表 |
|--------|---------|---------|
| OpenAI | 2 | gpt-4, gpt-3.5-turbo |
| Grok | 1 | grok-beta |
| Qwen | 2 | qwen-plus, qwen-turbo |
| DeepSeek | 0 | (无模型) |

---

## 🔄 兼容性

### modelPresets 仍然保留
`modelPresets` 对象没有被删除,仍然用于:
1. **设置默认API Base URL**: 选择供应商时自动填充
2. **新模型的默认配置**: 输入数据库中不存在的模型名时,尝试从预设获取默认配置

### 工作逻辑
```
选择供应商 → 从数据库加载模型列表
    ↓
选择/输入模型名
    ↓
优先从数据库模型中查找配置
    ↓ (未找到)
尝试从 modelPresets 获取默认配置
```

---

## 🧪 测试验证

### 后端API测试
```bash
#!/bin/bash
TOKEN="YOUR_ADMIN_TOKEN"

# 测试 OpenAI
curl -s "http://localhost:50301/api/manage/ai-models/by-provider/openai" \
  -H "Authorization: Bearer $TOKEN" | jq

# 测试 Grok
curl -s "http://localhost:50301/api/manage/ai-models/by-provider/grok" \
  -H "Authorization: Bearer $TOKEN" | jq

# 测试 Qwen
curl -s "http://localhost:50301/api/manage/ai-models/by-provider/qwen" \
  -H "Authorization: Bearer $TOKEN" | jq

# 测试 DeepSeek
curl -s "http://localhost:50301/api/manage/ai-models/by-provider/deepseek" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 前端测试步骤
1. 访问: http://localhost:53004/
2. 登录: admin / admin123
3. 进入 "AI模型管理"
4. 点击 "新增模型"
5. 选择供应商 (Grok)
6. 查看模型标识下拉框 → 应显示 "grok-beta"
7. 打开浏览器开发者工具(F12):
   - **Console**: 查看日志输出
   - **Network**: 查看 API 请求

---

## 🚀 服务运行状态

### 后端
- **端口**: 50301
- **环境**: production
- **状态**: ✅ 运行中
- **日志**: /tmp/backend-new.log

### 管理前端
- **端口**: 53004
- **URL**: http://localhost:53004/
- **状态**: ✅ 运行中
- **日志**: /tmp/admin-frontend.log

### 数据库
- **端口**: 54320
- **数据库**: fortune_db
- **状态**: ✅ 运行中

---

## 📝 更新文件清单

### 后端
✅ `backend/src/controllers/aiModels.ts` - 新增 `getAIModelsByProvider`
✅ `backend/src/routes/aiModels.ts` - 新增 `/by-provider/:provider` 路由

### 前端
✅ `admin-frontend/src/pages/AIModelManagement.tsx` - 完整更新
  - 新增 `providerModels` 和 `providerModelsLoading` 状态
  - 更新 `handleProviderChange` - 获取数据库模型
  - 更新 `handleOpenModal` - 编辑时加载模型
  - 更新 `handleModelNameChange` - 优先使用数据库配置
  - 更新 Select 组件 - 显示数据库模型

---

## ✅ 完成状态

- ✅ 后端API实现并测试通过
- ✅ 前端代码更新完成
- ✅ TypeScript编译通过 (0错误)
- ✅ 服务已重启并运行
- ⏳ 等待浏览器测试验证

---

**更新时间**: 2025-01-14
**开发者**: Claude Code
**状态**: ✅ 代码完成,待用户测试验证
