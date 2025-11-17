import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import * as articleService from '../services/articleService'
import type { Article } from '../services/articleService'
import ShareButton from '../components/ShareButton'
import './ArticleDetailPage.css'

const ArticleDetailPage = () => {
  const { t } = useTranslation()
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
      const response = await articleService.getArticleDetail(id!)
      if (response.data.success && response.data.data) {
        setArticle(response.data.data)
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
          ← {t('articles.back')}
        </button>
        <h1>{t('articles.detailTitle')}</h1>
        <div></div>
      </div>

      <div className="article-detail-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">{t('articles.loading')}</div>
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
                <span className="meta-item">👁️ {article.view_count} {t('articles.views')}</span>
                <span className="meta-item">📅 {formatDate(article.publish_time)}</span>
              </div>
              <p className="article-summary-full">{article.summary}</p>
            </div>
            <div className="article-content-full">
              <ReactMarkdown>{article.content}</ReactMarkdown>
            </div>
            <div className="article-actions" style={{ marginTop: '32px', textAlign: 'center' }}>
              <ShareButton
                shareType="article"
                targetId={id || ''}
                title={article.title}
                description={article.summary || ''}
              />
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">❌</div>
            <p>{t('articles.notFound')}</p>
            <button onClick={() => navigate('/articles')} className="back-to-list-btn">
              {t('articles.backToList')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArticleDetailPage
