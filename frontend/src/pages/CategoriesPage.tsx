import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as fortuneService from '../services/fortuneService'
import './CategoriesPage.css'

interface Category {
  category: string
  name: string
  count: number
  minPrice: number
  maxPrice: number
}

const CategoriesPage = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fortuneService.getCategories()
      setCategories(response.data.data || [])
    } catch (error) {
      console.error('加载分类失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'fortune': '🔮',
      'name': '📝',
      'marriage': '💕',
      'other': '⭐',
      'birth-animal': '🐍',
      'bazi': '🎋',
      'yearly': '🎊',
      'career': '💼',
      'wealth': '💰',
      'romance': '💖',
    }
    return icons[category] || '✨'
  }

  const handleCategoryClick = (category: Category) => {
    // 跳转到首页并应用分类筛选
    navigate(`/?category=${category.category}`)
  }

  return (
    <div className="categories-page">
      <div className="categories-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1>服务分类</h1>
        <div></div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">加载中...</div>
        </div>
      ) : (
        <div className="categories-container">
          <div className="categories-grid">
            {categories.map((cat) => (
              <div
                key={cat.category}
                className="category-card"
                onClick={() => handleCategoryClick(cat)}
              >
                <div className="category-icon-large">
                  {getCategoryIcon(cat.category)}
                </div>
                <h2 className="category-name">{cat.name}</h2>
                <div className="category-stats">
                  <span className="category-count">{cat.count} 项服务</span>
                  <span className="category-price-range">
                    ¥{cat.minPrice} - ¥{cat.maxPrice}
                  </span>
                </div>
                <button className="view-btn">查看服务</button>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>暂无分类</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CategoriesPage
