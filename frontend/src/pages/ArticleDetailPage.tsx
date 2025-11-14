import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import './ArticleDetailPage.css'

interface Article {
  id: number
  title: string
  summary: string
  content: string
  category: string
  cover_image?: string
  author: string
  view_count: number
  publish_time: string
}

const ArticleDetailPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadArticle()
    }
  }, [id])

  const loadArticle = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/articles/${id}`)
      const data = await response.json()
      if (data.success) {
        setArticle(data.data)
      }
    } catch (error) {
      console.error('加载文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="article-detail-page">
      <div className="article-detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1>文章详情</h1>
        <div></div>
      </div>

      <div className="article-detail-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">加载中...</div>
          </div>
        ) : article ? (
          <>
            {article.cover_image && (
              <div className="article-cover-full">
                <img src={article.cover_image} alt={article.title} />
              </div>
            )}
            <div className="article-header-info">
              <h1 className="article-title-full">{article.title}</h1>
              <div className="article-meta-full">
                <span className="meta-item">👤 {article.author}</span>
                <span className="meta-item">👁️ {article.view_count} 次阅读</span>
                <span className="meta-item">📅 {formatDate(article.publish_time)}</span>
              </div>
              <p className="article-summary-full">{article.summary}</p>
            </div>
            <div className="article-content-full">
              <ReactMarkdown>{article.content}</ReactMarkdown>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">❌</div>
            <p>文章不存在或已被删除</p>
            <button onClick={() => navigate('/articles')} className="back-to-list-btn">
              返回列表
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArticleDetailPage
