import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as fortuneResultService from '../services/fortuneResultService'
import * as fortuneService from '../services/fortuneService'
import type { Fortune } from '../types'
import './FortuneInputPage.css'

const FortuneInputPage = () => {
  const { id: fortuneId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const navigate = useNavigate()
  const { user } = useAuth()

  const [fortune, setFortune] = useState<Fortune | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadFortune()
  }, [fortuneId, user])

  const loadFortune = async () => {
    if (!fortuneId) return
    try {
      const res = await fortuneService.getFortune(fortuneId)
      setFortune(res.data.data!)
    } catch (error) {
      console.error('获取算命服务失败:', error)
      alert('获取算命服务失败')
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fortuneId || !fortune) return

    setLoading(true)
    try {
      const res = await fortuneResultService.calculateAndSave({
        fortuneId,
        fortuneType: fortuneId,
        inputData: formData,
        orderId: orderId || undefined,
      })

      // 跳转到结果页面
      navigate(`/fortune-result/${res.data.data!.result_id}`)
    } catch (error: any) {
      console.error('计算失败:', error)
      alert(error.response?.data?.message || '计算失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (!fortune) {
    return (
      <div className="fortune-input-page">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  return (
    <div className="fortune-input-page">
      <div className="header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1>{fortune.title}</h1>
        <p className="subtitle">{fortune.description}</p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {renderFormFields(fortuneId!, formData, handleInputChange)}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '计算中...' : '开始测算'}
          </button>
        </form>
      </div>
    </div>
  )
}

// 根据不同算命类型渲染不同表单
function renderFormFields(
  fortuneType: string,
  formData: Record<string, any>,
  onChange: (field: string, value: any) => void
) {
  switch (fortuneType) {
    case 'birth-animal':
      return (
        <div className="form-fields">
          <h3>请输入您的生日信息</h3>
          <div className="form-group">
            <label>出生年份 *</label>
            <input
              type="number"
              placeholder="如：1990"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.birthYear || ''}
              onChange={e => onChange('birthYear', parseInt(e.target.value))}
              required
            />
          </div>
          <div className="form-group">
            <label>出生月份 *</label>
            <select
              value={formData.birthMonth || ''}
              onChange={e => onChange('birthMonth', parseInt(e.target.value))}
              required
            >
              <option value="">请选择</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>出生日期 *</label>
            <select
              value={formData.birthDay || ''}
              onChange={e => onChange('birthDay', parseInt(e.target.value))}
              required
            >
              <option value="">请选择</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d}日</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>出生时辰（可选）</label>
            <select
              value={formData.birthHour || ''}
              onChange={e => onChange('birthHour', parseInt(e.target.value))}
            >
              <option value="">不确定</option>
              {Array.from({ length: 24 }, (_, i) => i).map(h => (
                <option key={h} value={h}>{h}时</option>
              ))}
            </select>
          </div>
        </div>
      )

    case 'bazi':
      return (
        <div className="form-fields">
          <h3>请输入您的详细生辰信息</h3>
          <div className="form-group">
            <label>性别 *</label>
            <div className="gender-group">
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={e => onChange('gender', e.target.value)}
                  required
                />
                男
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={e => onChange('gender', e.target.value)}
                  required
                />
                女
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>出生年份 *</label>
            <input
              type="number"
              placeholder="如：1990"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.birthYear || ''}
              onChange={e => onChange('birthYear', parseInt(e.target.value))}
              required
            />
          </div>
          <div className="form-group">
            <label>出生月份 *</label>
            <select
              value={formData.birthMonth || ''}
              onChange={e => onChange('birthMonth', parseInt(e.target.value))}
              required
            >
              <option value="">请选择</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>出生日期 *</label>
            <select
              value={formData.birthDay || ''}
              onChange={e => onChange('birthDay', parseInt(e.target.value))}
              required
            >
              <option value="">请选择</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d}日</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>出生时辰 *</label>
            <select
              value={formData.birthHour || ''}
              onChange={e => onChange('birthHour', parseInt(e.target.value))}
              required
            >
              <option value="">请选择</option>
              {Array.from({ length: 24 }, (_, i) => i).map(h => (
                <option key={h} value={h}>{h}时</option>
              ))}
            </select>
          </div>
        </div>
      )

    case 'flow-year':
      return (
        <div className="form-fields">
          <h3>请输入您的生日和目标年份</h3>
          <div className="form-group">
            <label>出生年份 *</label>
            <input
              type="number"
              placeholder="如：1990"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.birthYear || ''}
              onChange={e => onChange('birthYear', parseInt(e.target.value))}
              required
            />
          </div>
          <div className="form-group">
            <label>目标年份 *</label>
            <input
              type="number"
              placeholder="如：2025"
              min={new Date().getFullYear()}
              max={new Date().getFullYear() + 10}
              value={formData.targetYear || ''}
              onChange={e => onChange('targetYear', parseInt(e.target.value))}
              required
            />
          </div>
        </div>
      )

    case 'name-detail':
      return (
        <div className="form-fields">
          <h3>请输入您的姓名和生日</h3>
          <div className="form-group">
            <label>姓名 *</label>
            <input
              type="text"
              placeholder="请输入您的姓名"
              value={formData.name || ''}
              onChange={e => onChange('name', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>出生年份 *</label>
            <input
              type="number"
              placeholder="如：1990"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.birthYear || ''}
              onChange={e => onChange('birthYear', parseInt(e.target.value))}
              required
            />
          </div>
          <div className="form-group">
            <label>出生月份 *</label>
            <select
              value={formData.birthMonth || ''}
              onChange={e => onChange('birthMonth', parseInt(e.target.value))}
              required
            >
              <option value="">请选择</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>出生日期 *</label>
            <select
              value={formData.birthDay || ''}
              onChange={e => onChange('birthDay', parseInt(e.target.value))}
              required
            >
              <option value="">请选择</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d}日</option>
              ))}
            </select>
          </div>
        </div>
      )

    case 'marriage':
      return (
        <div className="form-fields">
          <h3>请输入双方的姓名和生日</h3>
          <div className="person-section">
            <h4>第一位</h4>
            <div className="form-group">
              <label>姓名 *</label>
              <input
                type="text"
                placeholder="请输入姓名"
                value={formData.person1_name || ''}
                onChange={e => {
                  const person1 = formData.person1 || {}
                  onChange('person1', { ...person1, name: e.target.value })
                  onChange('person1_name', e.target.value)
                }}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>出生年份 *</label>
                <input
                  type="number"
                  placeholder="如：1990"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.person1_birthYear || ''}
                  onChange={e => {
                    const val = parseInt(e.target.value)
                    const person1 = formData.person1 || {}
                    onChange('person1', { ...person1, birthYear: val })
                    onChange('person1_birthYear', val)
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label>月份 *</label>
                <select
                  value={formData.person1_birthMonth || ''}
                  onChange={e => {
                    const val = parseInt(e.target.value)
                    const person1 = formData.person1 || {}
                    onChange('person1', { ...person1, birthMonth: val })
                    onChange('person1_birthMonth', val)
                  }}
                  required
                >
                  <option value="">选择</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>日期 *</label>
                <select
                  value={formData.person1_birthDay || ''}
                  onChange={e => {
                    const val = parseInt(e.target.value)
                    const person1 = formData.person1 || {}
                    onChange('person1', { ...person1, birthDay: val })
                    onChange('person1_birthDay', val)
                  }}
                  required
                >
                  <option value="">选择</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}日</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="person-section">
            <h4>第二位</h4>
            <div className="form-group">
              <label>姓名 *</label>
              <input
                type="text"
                placeholder="请输入姓名"
                value={formData.person2_name || ''}
                onChange={e => {
                  const person2 = formData.person2 || {}
                  onChange('person2', { ...person2, name: e.target.value })
                  onChange('person2_name', e.target.value)
                }}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>出生年份 *</label>
                <input
                  type="number"
                  placeholder="如：1992"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.person2_birthYear || ''}
                  onChange={e => {
                    const val = parseInt(e.target.value)
                    const person2 = formData.person2 || {}
                    onChange('person2', { ...person2, birthYear: val })
                    onChange('person2_birthYear', val)
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label>月份 *</label>
                <select
                  value={formData.person2_birthMonth || ''}
                  onChange={e => {
                    const val = parseInt(e.target.value)
                    const person2 = formData.person2 || {}
                    onChange('person2', { ...person2, birthMonth: val })
                    onChange('person2_birthMonth', val)
                  }}
                  required
                >
                  <option value="">选择</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>日期 *</label>
                <select
                  value={formData.person2_birthDay || ''}
                  onChange={e => {
                    const val = parseInt(e.target.value)
                    const person2 = formData.person2 || {}
                    onChange('person2', { ...person2, birthDay: val })
                    onChange('person2_birthDay', val)
                  }}
                  required
                >
                  <option value="">选择</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}日</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className="form-fields">
          <p className="error-message">不支持的算命类型</p>
        </div>
      )
  }
}

export default FortuneInputPage
