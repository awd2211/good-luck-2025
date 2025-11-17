import { Outlet } from 'react-router-dom'
import FloatingActionButton from '../components/FloatingActionButton'
import LanguageSwitcher from '../components/LanguageSwitcher'
import './MainLayout.css'

const MainLayout = () => {
  return (
    <div className="main-layout">
      <div className="language-switcher-container">
        <LanguageSwitcher />
      </div>
      <div className="main-content">
        <Outlet />
      </div>
      <FloatingActionButton />
    </div>
  )
}

export default MainLayout
