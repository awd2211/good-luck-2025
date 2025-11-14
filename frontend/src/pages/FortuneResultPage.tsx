import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as fortuneResultService from '../services/fortuneResultService'
import type { FortuneResult } from '../types'
import './FortuneResultPage.css'

const FortuneResultPage = () => {
  const { resultId } = useParams<{ resultId: string }>()
  const navigate = useNavigate()

  const [result, setResult] = useState<FortuneResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResult()
  }, [resultId])

  const loadResult = async () => {
    if (!resultId) return

    setLoading(true)
    try {
      const res = await fortuneResultService.getResult(resultId)
      setResult(res.data.data!)
    } catch (error) {
      console.error('获取结果失败:', error)
      alert('获取结果失败')
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
        <div className="result-card basic-info">
          <h2>基本信息</h2>
          {result_data.shengxiao && (
            <div className="info-item">
              <span className="label">生肖：</span>
              <span className="value">{result_data.shengxiao}</span>
            </div>
          )}
          {result_data.ganzhi && (
            <div className="info-item">
              <span className="label">干支：</span>
              <span className="value">{result_data.ganzhi}</span>
            </div>
          )}
          {result_data.wuxing && (
            <div className="info-item">
              <span className="label">五行：</span>
              <span className="value">{result_data.wuxing}</span>
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

        {/* 运势评分 */}
        {result_data.score !== undefined && (
          <div className="result-card score-card">
            <h2>运势评分</h2>
            <div className="score-circle">
              <div className="score-value">{result_data.score}</div>
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
                  <div className="fortune-text">{result_data.fortune.overall}</div>
                </div>
              </div>
            )}
            {result_data.fortune.career && (
              <div className="fortune-item">
                <div className="fortune-icon">💼</div>
                <div className="fortune-content">
                  <div className="fortune-title">事业运势</div>
                  <div className="fortune-text">{result_data.fortune.career}</div>
                </div>
              </div>
            )}
            {result_data.fortune.wealth && (
              <div className="fortune-item">
                <div className="fortune-icon">💰</div>
                <div className="fortune-content">
                  <div className="fortune-title">财运运势</div>
                  <div className="fortune-text">{result_data.fortune.wealth}</div>
                </div>
              </div>
            )}
            {result_data.fortune.health && (
              <div className="fortune-item">
                <div className="fortune-icon">❤️</div>
                <div className="fortune-content">
                  <div className="fortune-title">健康运势</div>
                  <div className="fortune-text">{result_data.fortune.health}</div>
                </div>
              </div>
            )}
            {result_data.fortune.love && (
              <div className="fortune-item">
                <div className="fortune-icon">💕</div>
                <div className="fortune-content">
                  <div className="fortune-title">感情运势</div>
                  <div className="fortune-text">{result_data.fortune.love}</div>
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

        {/* 婚姻分析 */}
        {result_data.compatibility !== undefined && (
          <div className="result-card marriage-card">
            <h2>婚姻匹配度</h2>
            <div className="compatibility-score">
              <div className="score-bar">
                <div className="score-fill" style={{ width: `${result_data.compatibility}%` }}>
                  {result_data.compatibility}%
                </div>
              </div>
            </div>
            {result_data.marriageAnalysis && (
              <div className="marriage-analysis">
                <p>{result_data.marriageAnalysis}</p>
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
                <span>{result_data.nameScore.tiange}分</span>
              </div>
              <div className="score-item">
                <span>地格：</span>
                <span>{result_data.nameScore.dige}分</span>
              </div>
              <div className="score-item">
                <span>人格：</span>
                <span>{result_data.nameScore.renge}分</span>
              </div>
              <div className="score-item">
                <span>总格：</span>
                <span>{result_data.nameScore.zongge}分</span>
              </div>
              <div className="score-item">
                <span>外格：</span>
                <span>{result_data.nameScore.waige}分</span>
              </div>
            </div>
          </div>
        )}

        {/* 底部操作按钮 */}
        <div className="action-buttons">
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
