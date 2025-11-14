import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ArticlesPage.css'

interface Article {
  id: number
  title: string
  summary: string
  category: string
  cover_image?: string
  author: string
  view_count: number
  publish_time: string
}

const ArticlesPage = () => {
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
      const response = await fetch(`/api/articles?page=${page}&limit=10`)
      const data = await response.json()
      if (data.success) {
        setArticles(data.data)
        setTotalPages(data.pagination.totalPages)
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
          ← 返回
        </button>
        <h1>算命知识</h1>
        <div></div>
      </div>

      <div className="articles-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">加载中...</div>
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
                      <span className="article-views">👁️ {article.view_count}</span>
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
                  上一页
                </button>
                <span>第 {page} / {totalPages} 页</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <p>暂无文章</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArticlesPage
