import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import FloatingActionButton from '../components/FloatingActionButton'
import './MainLayout.css'

const MainLayout = () => {
  return (
    <div className="main-layout">
      <div className="main-content">
        <Outlet />
      </div>
      <BottomNav />
      <FloatingActionButton />
    </div>
  )
}

export default MainLayout
