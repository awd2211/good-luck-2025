import { Form, Input, InputNumber, Switch, Select, Space, Button, Divider } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useEffect } from 'react'

const { TextArea } = Input
const { Option } = Select

interface DynamicConfigFormProps {
  initialValues: any
  onValuesChange: (values: any) => void
}

// 判断值的类型
const getValueType = (value: any): string => {
  if (value === null || value === undefined) return 'string'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  return 'string'
}

// 渲染单个字段
const renderField = (key: string, value: any, path: string[] = []): JSX.Element => {
  const fieldPath = [...path, key]
  const fieldName = fieldPath.join('.')
  const type = getValueType(value)

  switch (type) {
    case 'boolean':
      return (
        <Form.Item
          key={fieldName}
          name={fieldPath}
          label={key}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      )

    case 'number':
      return (
        <Form.Item
          key={fieldName}
          name={fieldPath}
          label={key}
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
      )

    case 'array':
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        // 对象数组 - 使用Form.List
        return (
          <Form.Item key={fieldName} label={key}>
            <Form.List name={fieldPath}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <div style={{ flex: 1, border: '1px solid #d9d9d9', padding: 12, borderRadius: 4 }}>
                        {Object.keys(value[0]).map(subKey => {
                          const subValue = value[0][subKey]
                          return renderField(subKey, subValue, [...fieldPath, String(index)])
                        })}
                      </div>
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加 {key}
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        )
      } else {
        // 简单数组 - 使用Select mode="tags"
        return (
          <Form.Item
            key={fieldName}
            name={fieldPath}
            label={key}
          >
            <Select mode="tags" style={{ width: '100%' }} placeholder="输入后按回车添加">
              {Array.isArray(value) && value.map((item, idx) => (
                <Option key={idx} value={item}>{item}</Option>
              ))}
            </Select>
          </Form.Item>
        )
      }

    case 'object':
      // 嵌套对象
      return (
        <div key={fieldName} style={{ marginBottom: 16 }}>
          <Divider orientation="left">{key}</Divider>
          <div style={{ paddingLeft: 24 }}>
            {Object.keys(value).map(subKey => renderField(subKey, value[subKey], fieldPath))}
          </div>
        </div>
      )

    default:
      // 字符串 - 如果值很长使用TextArea，否则使用Input
      const isLongText = typeof value === 'string' && value.length > 50
      return (
        <Form.Item
          key={fieldName}
          name={fieldPath}
          label={key}
        >
          {isLongText ? (
            <TextArea rows={3} />
          ) : (
            <Input />
          )}
        </Form.Item>
      )
  }
}

// 将嵌套对象展平为Form可以识别的格式
const flattenObject = (obj: any, prefix: string[] = []): any => {
  const result: any = {}

  for (const key in obj) {
    const value = obj[key]
    const newPrefix = [...prefix, key]

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newPrefix))
    } else {
      result[newPrefix.join('.')] = value
    }
  }

  return result
}

const DynamicConfigForm: React.FC<DynamicConfigFormProps> = ({ initialValues, onValuesChange }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues)
    }
  }, [initialValues, form])

  const handleValuesChange = (_: any, allValues: any) => {
    onValuesChange(allValues)
  }

  if (!initialValues) {
    return <div>无配置数据</div>
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
      initialValues={initialValues}
    >
      {Object.keys(initialValues).map(key => renderField(key, initialValues[key]))}
    </Form>
  )
}

export default DynamicConfigForm
