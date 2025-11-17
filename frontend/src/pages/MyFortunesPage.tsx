import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import * as fortuneResultService from '../services/fortuneResultService'
import type { FortuneResult } from '../types'
import { showToast } from '../components/ToastContainer'
import { SkeletonList } from '../components/Skeleton'
import './MyFortunesPage.css'

const MyFortunesPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()

  const [results, setResults] = useState<FortuneResult[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

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
        if (value.wood) elements.push(`木${value.wood}`)
        if (value.fire) elements.push(`火${value.fire}`)
        if (value.earth) elements.push(`土${value.earth}`)
        if (value.metal) elements.push(`金${value.metal}`)
        if (value.water) elements.push(`水${value.water}`)
        return elements.join(' ')
      }

      // 否则JSON化
      return JSON.stringify(value)
    }
    return String(value)
  }

  useEffect(() => {
    // 等待认证状态加载完成
    if (isLoading) {
      return
    }

    if (!user) {
      navigate('/login')
      return
    }
    loadResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, isLoading])

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
    if (!confirm(t('myFortunes.deleteConfirm'))) return

    try {
      await fortuneResultService.deleteResult(resultId)
      showToast({ title: t('common.success'), content: t('myFortunes.deleteSuccess'), type: 'success' })
      loadResults()
    } catch (error) {
      console.error('删除失败:', error)
      showToast({ title: t('common.error'), content: t('myFortunes.deleteFailed'), type: 'error' })
    }
  }

  const getFortuneTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'birth-animal': t('myFortunes.birthAnimalType'),
      'bazi': t('myFortunes.baziType'),
      'flow-year': t('myFortunes.flowYearType'),
      'name-detail': t('myFortunes.nameDetailType'),
      'marriage': t('myFortunes.marriageType'),
    }
    return labels[type] || type
  }

  return (
    <div className="my-fortunes-page">
      <div className="header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← {t('myFortunes.back')}
        </button>
        <h1>{t('myFortunes.title')}</h1>
        <p className="subtitle">{t('myFortunes.totalRecords', { count: total })}</p>
      </div>

      {loading ? (
        <div className="results-container">
          <SkeletonList count={5} />
        </div>
      ) : results.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📝</div>
          <p>{t('myFortunes.noRecords')}</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            {t('myFortunes.goCalculate')}
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
                    <span className="preview-item">生肖：{safeRender(result.result_data.shengxiao)}</span>
                  )}
                  {result.result_data.score !== undefined && (
                    <span className="preview-item">评分：{safeRender(result.result_data.score)}分</span>
                  )}
                  {result.result_data.wuxing && (
                    <span className="preview-item">五行：{safeRender(result.result_data.wuxing)}</span>
                  )}
                </div>

                <div className="result-actions">
                  <button
                    className="btn-view"
                    onClick={() => navigate(`/fortune-result/${result.result_id}`)}
                  >
                    {t('myFortunes.viewDetails')}
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(result.result_id)}
                  >
                    {t('myFortunes.delete')}
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
                {t('myFortunes.prevPage')}
              </button>
              <span className="page-info">
                {t('myFortunes.pageInfo', { current: page, total: totalPages })}
              </span>
              <button
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t('myFortunes.nextPage')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MyFortunesPage
