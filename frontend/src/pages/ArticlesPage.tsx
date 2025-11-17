import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as articleService from '../services/articleService'
import type { Article } from '../services/articleService'
import { SkeletonCard } from '../components/Skeleton'
import './ArticlesPage.css'

const ArticlesPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    loadArticles()
  }, [page])

  const loadArticles = async () => {
    try {
      setLoading(true)
      const response = await articleService.getArticles({ page, limit: 10 })
      if (response.data.success) {
        setArticles(response.data.data)
        setTotalPages(response.data.pagination?.total_pages || 0)
      }
    } catch (error) {
      console.error('加载文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleArticleClick = (id: number) => {
    navigate(`/articles/${id}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  return (
    <div className="articles-page">
      <div className="articles-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← {t('articles.back')}
        </button>
        <h1>{t('articles.title')}</h1>
        <div></div>
      </div>

      <div className="articles-container">
        {loading ? (
          <div className="articles-list">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <>
            <div className="articles-list">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="article-card"
                  onClick={() => handleArticleClick(article.id)}
                >
                  {article.cover_image && (
                    <div className="article-cover">
                      <img src={article.cover_image} alt={article.title} />
                    </div>
                  )}
                  <div className="article-content">
                    <h3 className="article-title">{article.title}</h3>
                    <p className="article-summary">{article.summary}</p>
                    <div className="article-meta">
                      <span className="article-author">👤 {article.author}</span>
                      <span className="article-views">👁️ {article.view_count} {t('articles.views')}</span>
                      <span className="article-date">
                        📅 {formatDate(article.publish_time)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t('articles.prevPage')}
                </button>
                <span>{t('articles.pageInfo', { current: page, total: totalPages })}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t('articles.nextPage')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <p>{t('articles.noArticles')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArticlesPage
