import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Dashboard from './pages/dashboard'
import Alunos from './pages/alunos'
import CalendarioDnd from './pages/calendarioDnd'
import Financeiro from './pages/financeiro'
import Sidebar from './components/Sidebar'

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  return (
    <Router>
      <div
        className={`min-h-screen w-screen text-gray-300 ${isSidebarCollapsed ? 'ml-[100px]' : 'ml-[500px]'}`}
      >
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={handleSidebarToggle} />
        <main className={`flex-1 transition-all duration-300 `}>
          <div className="p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/alunos" element={<Alunos />} />
              <Route path="/calendario-dnd" element={<CalendarioDnd />} />
              <Route path="/financeiro" element={<Financeiro />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  )
}

export default App
