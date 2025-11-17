import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as fortuneResultService from '../services/fortuneResultService'
import type { FortuneResult } from '../types'
import ShareButton from '../components/ShareButton'
import { showToast } from '../components/ToastContainer'
import './FortuneResultPage.css'

const FortuneResultPage = () => {
  const { resultId } = useParams<{ resultId: string }>()
  const navigate = useNavigate()

  const [result, setResult] = useState<FortuneResult | null>(null)
  const [loading, setLoading] = useState(true)

  // 安全渲染函数：处理字符串、数组、对象
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    if (typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return value.join('、')
    if (typeof value === 'object') {
      // 如果是{primary, secondary}格式，优先显示primary
      if (value.primary) return String(value.primary)

      // 如果是五行对象 {fire, wood, earth, metal, water}，格式化显示
      if (value.fire !== undefined || value.wood !== undefined ||
          value.earth !== undefined || value.metal !== undefined || value.water !== undefined) {
        const elements = []
        if (value.wood) elements.push(`木:${value.wood}`)
        if (value.fire) elements.push(`火:${value.fire}`)
        if (value.earth) elements.push(`土:${value.earth}`)
        if (value.metal) elements.push(`金:${value.metal}`)
        if (value.water) elements.push(`水:${value.water}`)
        return elements.join(' ')
      }

      // 否则JSON化
      return JSON.stringify(value)
    }
    return String(value)
  }

  useEffect(() => {
    loadResult()
  }, [resultId])

  const loadResult = async () => {
    if (!resultId) return

    setLoading(true)
    try {
      const res = await fortuneResultService.getResult(resultId)
      console.log('=== 获取到的算命结果 ===')
      console.log('完整响应:', res.data)
      console.log('result_data:', res.data.data?.result_data)
      console.log('result_data keys:', res.data.data?.result_data ? Object.keys(res.data.data.result_data) : 'N/A')
      setResult(res.data.data!)
    } catch (error) {
      console.error('获取结果失败:', error)
      showToast({ title: '错误', content: '获取结果失败', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fortune-result-page">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="fortune-result-page">
        <div className="error">未找到算命结果</div>
      </div>
    )
  }

  const { result_data } = result

  // 兼容不同的数据结构
  const basicInfo = result_data.basicInfo || result_data
  const shengxiao = basicInfo.shengxiao
  const ganzhi = basicInfo.ganzhi
  const wuxing = basicInfo.wuxing

  return (
    <div className="fortune-result-page">
      <div className="header">
        <button className="back-btn" onClick={() => navigate('/my-fortunes')}>
          ← 返回
        </button>
        <h1>测算结果</h1>
        <p className="date">{new Date(result.created_at).toLocaleString()}</p>
      </div>

      <div className="result-container">
        {/* 基本信息卡片 */}
        {(shengxiao || ganzhi || wuxing || result_data.bazi) && (
          <div className="result-card basic-info">
            <h2>基本信息</h2>
            {shengxiao && (
              <div className="info-item">
                <span className="label">生肖：</span>
                <span className="value">{safeRender(shengxiao)}</span>
              </div>
            )}
            {ganzhi && (
              <div className="info-item">
                <span className="label">干支：</span>
                <span className="value">{safeRender(ganzhi)}</span>
              </div>
            )}
            {wuxing && (
              <div className="info-item">
                <span className="label">五行：</span>
                <span className="value">{safeRender(wuxing)}</span>
              </div>
            )}
          {result_data.bazi && (
            <div className="bazi-display">
              <div className="label">八字：</div>
              <div className="bazi-pillars">
                <div className="pillar">
                  <div className="tiangan">{result_data.bazi.year.charAt(0)}</div>
                  <div className="dizhi">{result_data.bazi.year.charAt(1)}</div>
                  <div className="pillar-label">年柱</div>
                </div>
                <div className="pillar">
                  <div className="tiangan">{result_data.bazi.month.charAt(0)}</div>
                  <div className="dizhi">{result_data.bazi.month.charAt(1)}</div>
                  <div className="pillar-label">月柱</div>
                </div>
                <div className="pillar">
                  <div className="tiangan">{result_data.bazi.day.charAt(0)}</div>
                  <div className="dizhi">{result_data.bazi.day.charAt(1)}</div>
                  <div className="pillar-label">日柱</div>
                </div>
                <div className="pillar">
                  <div className="tiangan">{result_data.bazi.hour.charAt(0)}</div>
                  <div className="dizhi">{result_data.bazi.hour.charAt(1)}</div>
                  <div className="pillar-label">时柱</div>
                </div>
              </div>
            </div>
          )}
          </div>
        )}

        {/* 命格信息 */}
        {result_data.mingge && (
          <div className="result-card mingge-card">
            <h2>命格分析</h2>
            <div className="mingge-info">
              <div className="mingge-type">
                <span className="label">命格类型：</span>
                <span className="value">{safeRender(result_data.mingge.type)}</span>
              </div>
              <div className="mingge-level">
                <span className="label">命格等级：</span>
                <span className="value">{safeRender(result_data.mingge.level)}</span>
              </div>
              {result_data.mingge.score !== undefined && (
                <div className="mingge-score">
                  <span className="label">命格评分：</span>
                  <span className="value">{safeRender(result_data.mingge.score)}分</span>
                </div>
              )}
              {result_data.mingge.description && (
                <div className="mingge-desc">
                  <p>{safeRender(result_data.mingge.description)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 优势与劣势 */}
        {(result_data.strengths || result_data.weaknesses) && (
          <div className="result-card traits-card">
            <h2>性格特点</h2>
            {result_data.strengths && result_data.strengths.length > 0 && (
              <div className="traits-section">
                <h3>优势</h3>
                <ul className="traits-list">
                  {result_data.strengths.map((item: string, index: number) => (
                    <li key={index}>✓ {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {result_data.weaknesses && result_data.weaknesses.length > 0 && (
              <div className="traits-section">
                <h3>劣势</h3>
                <ul className="traits-list">
                  {result_data.weaknesses.map((item: string, index: number) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 各运势分析 */}
        {(result_data.careerSuggestion || result_data.wealthFortune || result_data.marriageFortune || result_data.healthFortune) && (
          <div className="result-card fortune-detail-card">
            <h2>运势详解</h2>
            {result_data.careerSuggestion && (
              <div className="fortune-item">
                <div className="fortune-icon">💼</div>
                <div className="fortune-content">
                  <div className="fortune-title">事业建议</div>
                  <div className="fortune-text">
                    {safeRender(result_data.careerSuggestion)}
                  </div>
                </div>
              </div>
            )}
            {result_data.wealthFortune && (
              <div className="fortune-item">
                <div className="fortune-icon">💰</div>
                <div className="fortune-content">
                  <div className="fortune-title">财运分析</div>
                  <div className="fortune-text">{safeRender(result_data.wealthFortune)}</div>
                </div>
              </div>
            )}
            {result_data.marriageFortune && (
              <div className="fortune-item">
                <div className="fortune-icon">💕</div>
                <div className="fortune-content">
                  <div className="fortune-title">婚姻运势</div>
                  <div className="fortune-text">{safeRender(result_data.marriageFortune)}</div>
                </div>
              </div>
            )}
            {result_data.healthFortune && (
              <div className="fortune-item">
                <div className="fortune-icon">❤️</div>
                <div className="fortune-content">
                  <div className="fortune-title">健康运势</div>
                  <div className="fortune-text">{safeRender(result_data.healthFortune)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 人生阶段 */}
        {result_data.lifePhases && (
          <div className="result-card life-phases-card">
            <h2>人生阶段运势</h2>
            {result_data.lifePhases.youth && (
              <div className="phase-item">
                <span className="phase-label">青年期：</span>
                <span className="phase-text">{safeRender(result_data.lifePhases.youth)}</span>
              </div>
            )}
            {result_data.lifePhases.middle && (
              <div className="phase-item">
                <span className="phase-label">中年期：</span>
                <span className="phase-text">{safeRender(result_data.lifePhases.middle)}</span>
              </div>
            )}
            {result_data.lifePhases.old && (
              <div className="phase-item">
                <span className="phase-label">老年期：</span>
                <span className="phase-text">{safeRender(result_data.lifePhases.old)}</span>
              </div>
            )}
          </div>
        )}

        {/* 建议 */}
        {result_data.advice && (
          <div className="result-card advice-card">
            <h2>命理建议</h2>
            <p className="advice-text">{safeRender(result_data.advice)}</p>
          </div>
        )}

        {/* 运势评分 */}
        {result_data.score !== undefined && (
          <div className="result-card score-card">
            <h2>运势评分</h2>
            <div className="score-circle">
              <div className="score-value">{safeRender(result_data.score)}</div>
              <div className="score-label">分</div>
            </div>
          </div>
        )}

        {/* 运势详解 */}
        {result_data.fortune && (
          <div className="result-card fortune-card">
            <h2>运势详解</h2>
            {result_data.fortune.overall && (
              <div className="fortune-item">
                <div className="fortune-icon">🌟</div>
                <div className="fortune-content">
                  <div className="fortune-title">综合运势</div>
                  <div className="fortune-text">{safeRender(result_data.fortune.overall)}</div>
                </div>
              </div>
            )}
            {result_data.fortune.career && (
              <div className="fortune-item">
                <div className="fortune-icon">💼</div>
                <div className="fortune-content">
                  <div className="fortune-title">事业运势</div>
                  <div className="fortune-text">{safeRender(result_data.fortune.career)}</div>
                </div>
              </div>
            )}
            {result_data.fortune.wealth && (
              <div className="fortune-item">
                <div className="fortune-icon">💰</div>
                <div className="fortune-content">
                  <div className="fortune-title">财运运势</div>
                  <div className="fortune-text">{safeRender(result_data.fortune.wealth)}</div>
                </div>
              </div>
            )}
            {result_data.fortune.health && (
              <div className="fortune-item">
                <div className="fortune-icon">❤️</div>
                <div className="fortune-content">
                  <div className="fortune-title">健康运势</div>
                  <div className="fortune-text">{safeRender(result_data.fortune.health)}</div>
                </div>
              </div>
            )}
            {result_data.fortune.love && (
              <div className="fortune-item">
                <div className="fortune-icon">💕</div>
                <div className="fortune-content">
                  <div className="fortune-title">感情运势</div>
                  <div className="fortune-text">{safeRender(result_data.fortune.love)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 幸运指南 */}
        {(result_data.luckyColors || result_data.luckyNumbers || result_data.luckyDirections) && (
          <div className="result-card lucky-card">
            <h2>幸运指南</h2>
            {result_data.luckyColors && result_data.luckyColors.length > 0 && (
              <div className="lucky-item">
                <span className="lucky-label">幸运色：</span>
                <div className="lucky-values">
                  {result_data.luckyColors.map((color: string, index: number) => (
                    <span key={index} className="lucky-tag">{color}</span>
                  ))}
                </div>
              </div>
            )}
            {result_data.luckyNumbers && result_data.luckyNumbers.length > 0 && (
              <div className="lucky-item">
                <span className="lucky-label">幸运数字：</span>
                <div className="lucky-values">
                  {result_data.luckyNumbers.map((num: number, index: number) => (
                    <span key={index} className="lucky-tag">{num}</span>
                  ))}
                </div>
              </div>
            )}
            {result_data.luckyDirections && result_data.luckyDirections.length > 0 && (
              <div className="lucky-item">
                <span className="lucky-label">幸运方位：</span>
                <div className="lucky-values">
                  {result_data.luckyDirections.map((dir: string, index: number) => (
                    <span key={index} className="lucky-tag">{dir}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 婚姻分析 / 配对分析 */}
        {result_data.compatibility !== undefined && (
          <div className="result-card marriage-card">
            <h2>{typeof result_data.compatibility === 'object' ? '配对分析' : '婚姻匹配度'}</h2>
            {typeof result_data.compatibility === 'number' ? (
              <div className="compatibility-score">
                <div className="score-bar">
                  <div className="score-fill" style={{ width: `${result_data.compatibility}%` }}>
                    {safeRender(result_data.compatibility)}%
                  </div>
                </div>
              </div>
            ) : typeof result_data.compatibility === 'object' ? (
              <div className="compatibility-details">
                {result_data.compatibility.love && (
                  <div className="compatibility-item">
                    <span className="compatibility-label">💕 爱情指数：</span>
                    <span className="compatibility-value">{safeRender(result_data.compatibility.love)}</span>
                  </div>
                )}
                {result_data.compatibility.friendship && (
                  <div className="compatibility-item">
                    <span className="compatibility-label">🤝 友情指数：</span>
                    <span className="compatibility-value">{safeRender(result_data.compatibility.friendship)}</span>
                  </div>
                )}
                {result_data.compatibility.cooperation && (
                  <div className="compatibility-item">
                    <span className="compatibility-label">🤝 合作指数：</span>
                    <span className="compatibility-value">{safeRender(result_data.compatibility.cooperation)}</span>
                  </div>
                )}
              </div>
            ) : null}
            {result_data.marriageAnalysis && (
              <div className="marriage-analysis">
                <p>{safeRender(result_data.marriageAnalysis)}</p>
              </div>
            )}
          </div>
        )}

        {/* 姓名评分 */}
        {result_data.nameScore && (
          <div className="result-card name-score-card">
            <h2>姓名评分</h2>
            <div className="name-score-details">
              <div className="score-item">
                <span>天格：</span>
                <span>{safeRender(result_data.nameScore.tiange)}分</span>
              </div>
              <div className="score-item">
                <span>地格：</span>
                <span>{safeRender(result_data.nameScore.dige)}分</span>
              </div>
              <div className="score-item">
                <span>人格：</span>
                <span>{safeRender(result_data.nameScore.renge)}分</span>
              </div>
              <div className="score-item">
                <span>总格：</span>
                <span>{safeRender(result_data.nameScore.zongge)}分</span>
              </div>
              <div className="score-item">
                <span>外格：</span>
                <span>{safeRender(result_data.nameScore.waige)}分</span>
              </div>
            </div>
          </div>
        )}

        {/* 底部操作按钮 */}
        <div className="action-buttons">
          <ShareButton
            shareType="fortune_result"
            targetId={resultId || ''}
            title={`我的${result.fortune_type}测算结果`}
            description={result_data.fortune?.overall ? safeRender(result_data.fortune.overall) : '查看我的算命测算结果'}
          />
          <button className="btn-secondary" onClick={() => navigate('/my-fortunes')}>
            查看历史记录
          </button>
          <button className="btn-primary" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    </div>
  )
}

export default FortuneResultPage
