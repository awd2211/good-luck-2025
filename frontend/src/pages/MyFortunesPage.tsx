import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as fortuneResultService from '../services/fortuneResultService'
import type { FortuneResult } from '../types'
import './MyFortunesPage.css'

const MyFortunesPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [results, setResults] = useState<FortuneResult[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadResults()
  }, [user, page])

  const loadResults = async () => {
    setLoading(true)
    try {
      const res = await fortuneResultService.getMyResults({ page, limit: 10 })
      setResults(res.data.data || [])
      setTotal(res.data.pagination?.total || 0)
      setTotalPages(res.data.pagination?.total_pages || 0)
    } catch (error) {
      console.error('获取算命记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (resultId: string) => {
    if (!confirm('确定要删除这条记录吗？')) return

    try {
      await fortuneResultService.deleteResult(resultId)
      alert('删除成功')
      loadResults()
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败')
    }
  }

  const getFortuneTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'birth-animal': '生肖运势',
      'bazi': '八字精批',
      'flow-year': '流年运势',
      'name-detail': '姓名详批',
      'marriage': '婚姻分析',
    }
    return labels[type] || type
  }

  return (
    <div className="my-fortunes-page">
      <div className="header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 返回
        </button>
        <h1>我的算命记录</h1>
        <p className="subtitle">共 {total} 条记录</p>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : results.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📝</div>
          <p>暂无算命记录</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            去测算
          </button>
        </div>
      ) : (
        <div className="results-container">
          <div className="results-list">
            {results.map(result => (
              <div key={result.id} className="result-item">
                <div className="result-header">
                  <div className="result-info">
                    <div className="result-type">
                      {result.fortune_info?.icon && (
                        <span className="icon">{result.fortune_info.icon}</span>
                      )}
                      <span className="type-label">
                        {result.fortune_info?.title || getFortuneTypeLabel(result.fortune_type)}
                      </span>
                    </div>
                    <div className="result-date">
                      {new Date(result.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>

                <div className="result-preview">
                  {result.result_data.shengxiao && (
                    <span className="preview-item">生肖：{result.result_data.shengxiao}</span>
                  )}
                  {result.result_data.score !== undefined && (
                    <span className="preview-item">评分：{result.result_data.score}分</span>
                  )}
                  {result.result_data.wuxing && (
                    <span className="preview-item">五行：{result.result_data.wuxing}</span>
                  )}
                </div>

                <div className="result-actions">
                  <button
                    className="btn-view"
                    onClick={() => navigate(`/fortune-result/${result.result_id}`)}
                  >
                    查看详情
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(result.result_id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </button>
              <span className="page-info">
                第 {page} / {totalPages} 页
              </span>
              <button
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MyFortunesPage
