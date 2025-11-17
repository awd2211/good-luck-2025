/**
 * 帮助中心页面
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as helpService from '../services/helpService'
import type { HelpCategory, HelpArticle, FAQ } from '../services/helpService'
import { showToast } from '../components/ToastContainer'
import './HelpCenterPage.css'

const HelpCenterPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState<'articles' | 'faqs'>('articles')
  const [categories, setCategories] = useState<HelpCategory[]>([])
  const [articles, setArticles] = useState<HelpArticle[]>([])
  const [faqs, setFAQs] = useState<FAQ[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCategories()
    const tab = searchParams.get('tab')
    if (tab === 'faqs') {
      setActiveTab('faqs')
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'articles') {
      loadArticles()
    } else {
      loadFAQs()
    }
  }, [activeTab, selectedCategory])

  const loadCategories = async () => {
    try {
      const response = await helpService.getCategories()
      if (response.data.success && response.data.data) {
        setCategories(response.data.data)
      }
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  }

  const loadArticles = async () => {
    try {
      setLoading(true)
      const response = await helpService.getArticles({
        categoryId: selectedCategory || undefined,
        keyword: searchKeyword || undefined,
        page: 1,
        limit: 50
      })
      if (response.data.success && response.data.data) {
        setArticles(response.data.data)
      }
    } catch (error) {
      console.error('加载文章失败:', error)
      showToast({ title: t('common.error'), content: t('helpCenter.loadFailed'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadFAQs = async () => {
    try {
      setLoading(true)
      const response = await helpService.getFAQs({
        categoryId: selectedCategory || undefined,
        keyword: searchKeyword || undefined,
        page: 1,
        limit: 50
      })
      if (response.data.success && response.data.data) {
        setFAQs(response.data.data)
      }
    } catch (error) {
      console.error('加载FAQ失败:', error)
      showToast({ title: t('common.error'), content: t('helpCenter.loadFailed'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (activeTab === 'articles') {
      loadArticles()
    } else {
      loadFAQs()
    }
  }

  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId)
    setSearchKeyword('')
  }

  const handleArticleClick = (id: number) => {
    navigate(`/help/article/${id}`)
  }

  return (
    <div className="help-center-page">
      {/* 头部 */}
      <div className="help-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← {t('helpCenter.back')}
        </button>
        <h1>{t('helpCenter.title')}</h1>
        <div></div>
      </div>

      {/* 搜索栏 */}
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={t('helpCenter.searchPlaceholder')}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          {searchKeyword && (
            <button
              className="clear-btn"
              onClick={() => {
                setSearchKeyword('')
                handleSearch()
              }}
            >
              ✕
            </button>
          )}
        </div>
        <button className="search-btn" onClick={handleSearch}>
          {t('helpCenter.search')}
        </button>
      </div>

      {/* 分类标签 */}
      {categories.length > 0 && (
        <div className="category-section">
          <button
            className={`category-tag ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => handleCategoryClick(null)}
          >
            {t('helpCenter.all')}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-tag ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category.id)}
            >
              {category.icon && <span className="tag-icon">{category.icon}</span>}
              {category.name}
              {category.article_count > 0 && (
                <span className="tag-count">({category.article_count})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 标签页切换 */}
      <div className="help-tabs">
        <button
          className={`tab-btn ${activeTab === 'articles' ? 'active' : ''}`}
          onClick={() => setActiveTab('articles')}
        >
          📄 {t('helpCenter.articles')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'faqs' ? 'active' : ''}`}
          onClick={() => setActiveTab('faqs')}
        >
          ❓ {t('helpCenter.faqs')}
        </button>
      </div>

      {/* 文章列表 */}
      {activeTab === 'articles' && (
        <div className="content-section">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner">{t('helpCenter.loading')}</div>
            </div>
          ) : articles.length > 0 ? (
            <div className="article-list">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="article-item"
                  onClick={() => handleArticleClick(article.id)}
                >
                  {article.is_featured && <span className="featured-badge">🔥 {t('helpCenter.popular')}</span>}
                  <h3 className="article-title">{article.title}</h3>
                  {article.summary && <p className="article-summary">{article.summary}</p>}
                  <div className="article-meta">
                    <span className="view-count">👁️ {t('helpCenter.viewCount', { count: article.view_count })}</span>
                    <span className="article-date">
                      {new Date(article.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <p>{t('helpCenter.noArticles')}</p>
            </div>
          )}
        </div>
      )}

      {/* FAQ列表 */}
      {activeTab === 'faqs' && (
        <div className="content-section">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner">{t('helpCenter.loading')}</div>
            </div>
          ) : faqs.length > 0 ? (
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <details key={faq.id} className="faq-item">
                  <summary className="faq-question">
                    <span className="faq-number">{index + 1}.</span>
                    {faq.question}
                    <span className="faq-arrow">›</span>
                  </summary>
                  <div className="faq-answer">{faq.answer}</div>
                  <div className="faq-meta">
                    <span className="view-count">👁️ {t('helpCenter.viewCount', { count: faq.view_count })}</span>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">❓</div>
              <p>{t('helpCenter.noFaqs')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default HelpCenterPage
