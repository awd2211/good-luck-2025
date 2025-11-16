import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as fortuneResultService from '../services/fortuneResultService'
import * as fortuneService from '../services/fortuneService'
import type { Fortune } from '../types'
import { showToast } from '../components/ToastContainer'
import { devLog } from '../utils/devLog'
import { logError } from '../utils/logger'
import './FortuneInputPage.css'

// 表单数据的值类型
type FormValue = string | number | boolean | undefined | { name?: string; birthYear?: number; birthMonth?: number; birthDay?: number }

// 表单数据类型
type FortuneFormData = Record<string, FormValue>

// 将数据库中的code映射到fortuneType
const mapCodeToType = (code?: string): string => {
  const mapping: Record<string, string> = {
    'bazi_detail': 'bazi',
    'bazi_year': 'flow-year',
    'bazi_mingge': 'bazi-mingge',
    'zodiac_fortune': 'birth-animal',
    'zodiac_match': 'zodiac-match',
    'star_fortune': 'star-fortune',
    'star_match': 'star-match',
    'name_detail': 'name-detail',
    'name_baby': 'name-baby',
    'marriage_match': 'marriage',
    'marriage_fate': 'marriage-analysis',
    'career_fortune': 'career',
    'wealth_fortune': 'wealth',
    'number_divination': 'number-divination',
    'purple_star': 'purple-star',
    'name_match': 'name-match',
  }
  return code ? (mapping[code] || code) : ''
}

const FortuneInputPage = () => {
  const { id: fortuneId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()

  const [fortune, setFortune] = useState<Fortune | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FortuneFormData>({})

  useEffect(() => {
    // 等待认证状态加载完成
    if (isLoading) {
      return
    }

    if (!user) {
      navigate('/login')
      return
    }
    loadFortune()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fortuneId, user, isLoading])

  const loadFortune = async () => {
    if (!fortuneId) return
    try {
      const res = await fortuneService.getFortune(fortuneId)
      setFortune(res.data.data!)
    } catch (error) {
      logError('获取算命服务失败', error, { fortuneId })
      showToast({ title: '错误', content: '获取算命服务失败', type: 'error' })
    }
  }

  const handleInputChange = (field: string, value: FormValue) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fortuneId || !fortune) return

    // 使用 fortune.code 映射到fortuneType
    // fortuneId 直接使用字符串化的 ID
    const actualFortuneId = String(fortune.id)
    const fortuneType = fortune.code ? mapCodeToType(fortune.code) : fortune.id

    devLog('提交数据:', { fortuneId: actualFortuneId, fortuneType, inputData: formData })

    setLoading(true)
    try {
      const res = await fortuneResultService.calculateAndSave({
        fortuneId: actualFortuneId,
        fortuneType,
        inputData: formData,
        orderId: orderId || undefined,
      })

      // 跳转到结果页面
      navigate(`/fortune-result/${res.data.data!.result_id}`)
    } catch (error: unknown) {
      console.error('计算失败:', error)
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || '计算失败，请重试'
        : '计算失败，请重试'
      showToast({ title: '错误', content: errorMessage, type: 'error' })
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

  // 获取映射后的fortuneType用于渲染表单
  const fortuneType = fortune.code ? mapCodeToType(fortune.code) : fortune.id

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
          {renderFormFields(fortuneType, formData, handleInputChange)}

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
  formData: FortuneFormData,
  onChange: (field: string, value: FormValue) => void
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

    case 'marriage-analysis':
      return (
        <div className="form-fields">
          <h3>请输入您的详细信息</h3>
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
        </div>
      )

    case 'name-match':
      return (
        <div className="form-fields">
          <h3>请输入双方的姓名信息</h3>
          <div className="person-section">
            <h4>第一位</h4>
            <div className="form-group">
              <label>姓名 *</label>
              <input
                type="text"
                placeholder="请输入姓名"
                value={formData.name1 || ''}
                onChange={e => onChange('name1', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>出生年份（可选）</label>
              <input
                type="number"
                placeholder="如：1990"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.birthYear1 || ''}
                onChange={e => onChange('birthYear1', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>
          <div className="person-section">
            <h4>第二位</h4>
            <div className="form-group">
              <label>姓名 *</label>
              <input
                type="text"
                placeholder="请输入姓名"
                value={formData.name2 || ''}
                onChange={e => onChange('name2', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>出生年份（可选）</label>
              <input
                type="number"
                placeholder="如：1992"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.birthYear2 || ''}
                onChange={e => onChange('birthYear2', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>
        </div>
      )

    case 'wealth':
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
            <label>目标年份（可选，默认今年）</label>
            <input
              type="number"
              placeholder={`如：${new Date().getFullYear()}`}
              min={new Date().getFullYear()}
              max={new Date().getFullYear() + 10}
              value={formData.targetYear || ''}
              onChange={e => onChange('targetYear', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </div>
      )

    case 'number-divination':
      return (
        <div className="form-fields">
          <h3>请输入号码信息</h3>
          <div className="form-group">
            <label>号码类型 *</label>
            <select
              value={formData.type || ''}
              onChange={e => onChange('type', e.target.value)}
              required
            >
              <option value="">请选择</option>
              <option value="phone">手机号</option>
              <option value="car">车牌号</option>
              <option value="house">房号</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div className="form-group">
            <label>号码 *</label>
            <input
              type="text"
              placeholder="请输入号码"
              value={formData.number || ''}
              onChange={e => onChange('number', e.target.value)}
              required
            />
          </div>
          <p className="hint">支持数字和字母，系统会自动提取数字进行分析</p>
        </div>
      )

    case 'purple-star':
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
          <p className="hint">紫微斗数是中国传统命理学中最重要的支派之一，需要精确的出生时辰</p>
        </div>
      )

    case 'bazi-mingge':
      return (
        <div className="form-fields">
          <h3>请输入您的详细生辰信息</h3>
          <div className="form-group">
            <label>性别 *</label>
            <div className="gender-group">
              <label>
                <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={e => onChange('gender', e.target.value)} required />
                男
              </label>
              <label>
                <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={e => onChange('gender', e.target.value)} required />
                女
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>出生年份 *</label>
            <input type="number" placeholder="如：1990" min="1900" max={new Date().getFullYear()} value={formData.birthYear || ''} onChange={e => onChange('birthYear', parseInt(e.target.value))} required />
          </div>
          <div className="form-group">
            <label>出生月份 *</label>
            <select value={formData.birthMonth || ''} onChange={e => onChange('birthMonth', parseInt(e.target.value))} required>
              <option value="">请选择</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (<option key={m} value={m}>{m}月</option>))}
            </select>
          </div>
          <div className="form-group">
            <label>出生日期 *</label>
            <select value={formData.birthDay || ''} onChange={e => onChange('birthDay', parseInt(e.target.value))} required>
              <option value="">请选择</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (<option key={d} value={d}>{d}日</option>))}
            </select>
          </div>
          <div className="form-group">
            <label>出生时辰 *</label>
            <select value={formData.birthHour || ''} onChange={e => onChange('birthHour', parseInt(e.target.value))} required>
              <option value="">请选择</option>
              {Array.from({ length: 24 }, (_, i) => i).map(h => (<option key={h} value={h}>{h}时</option>))}
            </select>
          </div>
          <p className="hint">命格测算需要完整的出生时辰，以分析您的命理格局</p>
        </div>
      )

    case 'zodiac-match':
      return (
        <div className="form-fields">
          <h3>请输入双方的生肖信息</h3>
          <div className="form-group">
            <label>您的出生年份 *</label>
            <input type="number" placeholder="如：1990" min="1900" max={new Date().getFullYear()} value={formData.birthYear1 || ''} onChange={e => onChange('birthYear1', parseInt(e.target.value))} required />
          </div>
          <div className="form-group">
            <label>对方的出生年份 *</label>
            <input type="number" placeholder="如：1992" min="1900" max={new Date().getFullYear()} value={formData.birthYear2 || ''} onChange={e => onChange('birthYear2', parseInt(e.target.value))} required />
          </div>
          <p className="hint">根据双方生肖分析配对指数和相处建议</p>
        </div>
      )

    case 'star-fortune':
      return (
        <div className="form-fields">
          <h3>请选择您的星座</h3>
          <div className="form-group">
            <label>星座 *</label>
            <select value={formData.starSign || ''} onChange={e => onChange('starSign', e.target.value)} required>
              <option value="">请选择</option>
              <option value="aries">白羊座 (3/21-4/19)</option>
              <option value="taurus">金牛座 (4/20-5/20)</option>
              <option value="gemini">双子座 (5/21-6/21)</option>
              <option value="cancer">巨蟹座 (6/22-7/22)</option>
              <option value="leo">狮子座 (7/23-8/22)</option>
              <option value="virgo">处女座 (8/23-9/22)</option>
              <option value="libra">天秤座 (9/23-10/23)</option>
              <option value="scorpio">天蝎座 (10/24-11/22)</option>
              <option value="sagittarius">射手座 (11/23-12/21)</option>
              <option value="capricorn">摩羯座 (12/22-1/19)</option>
              <option value="aquarius">水瓶座 (1/20-2/18)</option>
              <option value="pisces">双鱼座 (2/19-3/20)</option>
            </select>
          </div>
          <div className="form-group">
            <label>时间段 *</label>
            <select value={formData.period || ''} onChange={e => onChange('period', e.target.value)} required>
              <option value="">请选择</option>
              <option value="today">今日运势</option>
              <option value="week">本周运势</option>
              <option value="month">本月运势</option>
              <option value="year">年度运势</option>
            </select>
          </div>
          <p className="hint">查看您的星座运势，包括爱情、事业、财运等方面</p>
        </div>
      )

    case 'star-match':
      return (
        <div className="form-fields">
          <h3>请选择双方的星座</h3>
          <div className="form-group">
            <label>您的星座 *</label>
            <select value={formData.starSign1 || ''} onChange={e => onChange('starSign1', e.target.value)} required>
              <option value="">请选择</option>
              <option value="aries">白羊座</option>
              <option value="taurus">金牛座</option>
              <option value="gemini">双子座</option>
              <option value="cancer">巨蟹座</option>
              <option value="leo">狮子座</option>
              <option value="virgo">处女座</option>
              <option value="libra">天秤座</option>
              <option value="scorpio">天蝎座</option>
              <option value="sagittarius">射手座</option>
              <option value="capricorn">摩羯座</option>
              <option value="aquarius">水瓶座</option>
              <option value="pisces">双鱼座</option>
            </select>
          </div>
          <div className="form-group">
            <label>对方的星座 *</label>
            <select value={formData.starSign2 || ''} onChange={e => onChange('starSign2', e.target.value)} required>
              <option value="">请选择</option>
              <option value="aries">白羊座</option>
              <option value="taurus">金牛座</option>
              <option value="gemini">双子座</option>
              <option value="cancer">巨蟹座</option>
              <option value="leo">狮子座</option>
              <option value="virgo">处女座</option>
              <option value="libra">天秤座</option>
              <option value="scorpio">天蝎座</option>
              <option value="sagittarius">射手座</option>
              <option value="capricorn">摩羯座</option>
              <option value="aquarius">水瓶座</option>
              <option value="pisces">双鱼座</option>
            </select>
          </div>
          <p className="hint">分析双方星座的配对指数和相处建议</p>
        </div>
      )

    case 'name-baby':
      return (
        <div className="form-fields">
          <h3>请输入宝宝信息</h3>
          <div className="form-group">
            <label>姓氏 *</label>
            <input type="text" placeholder="如：张" maxLength={2} value={formData.lastName || ''} onChange={e => onChange('lastName', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>性别 *</label>
            <div className="gender-group">
              <label>
                <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={e => onChange('gender', e.target.value)} required />
                男
              </label>
              <label>
                <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={e => onChange('gender', e.target.value)} required />
                女
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>出生年份 *</label>
            <input type="number" placeholder="如：2024" min="2000" max={new Date().getFullYear() + 1} value={formData.birthYear || ''} onChange={e => onChange('birthYear', parseInt(e.target.value))} required />
          </div>
          <div className="form-group">
            <label>出生月份 *</label>
            <select value={formData.birthMonth || ''} onChange={e => onChange('birthMonth', parseInt(e.target.value))} required>
              <option value="">请选择</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (<option key={m} value={m}>{m}月</option>))}
            </select>
          </div>
          <div className="form-group">
            <label>出生日期 *</label>
            <select value={formData.birthDay || ''} onChange={e => onChange('birthDay', parseInt(e.target.value))} required>
              <option value="">请选择</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (<option key={d} value={d}>{d}日</option>))}
            </select>
          </div>
          <p className="hint">根据生辰八字为宝宝推荐吉祥好名</p>
        </div>
      )

    case 'career':
      return (
        <div className="form-fields">
          <h3>请输入您的信息</h3>
          <div className="form-group">
            <label>出生年份 *</label>
            <input type="number" placeholder="如：1990" min="1900" max={new Date().getFullYear()} value={formData.birthYear || ''} onChange={e => onChange('birthYear', parseInt(e.target.value))} required />
          </div>
          <div className="form-group">
            <label>出生月份 *</label>
            <select value={formData.birthMonth || ''} onChange={e => onChange('birthMonth', parseInt(e.target.value))} required>
              <option value="">请选择</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (<option key={m} value={m}>{m}月</option>))}
            </select>
          </div>
          <div className="form-group">
            <label>出生日期 *</label>
            <select value={formData.birthDay || ''} onChange={e => onChange('birthDay', parseInt(e.target.value))} required>
              <option value="">请选择</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (<option key={d} value={d}>{d}日</option>))}
            </select>
          </div>
          <div className="form-group">
            <label>当前职业（可选）</label>
            <input type="text" placeholder="如：软件工程师" value={formData.currentJob || ''} onChange={e => onChange('currentJob', e.target.value)} />
          </div>
          <div className="form-group">
            <label>目标年份 *</label>
            <input type="number" placeholder="如：2025" min={new Date().getFullYear()} max={new Date().getFullYear() + 10} value={formData.targetYear || ''} onChange={e => onChange('targetYear', parseInt(e.target.value))} required />
          </div>
          <p className="hint">分析您的事业运势，提供职业发展建议</p>
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
