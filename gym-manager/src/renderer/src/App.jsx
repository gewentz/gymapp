import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Dashboard from './pages/dashboard'
import Alunos from './pages/alunos'
import CalendarioDnd from './pages/calendarioDnd'
import Financeiro from './pages/financeiro'
import Sidebar from './components/Sidebar'
import Historico from './pages/historico'

// Componente para as rotas animadas
function AnimatedRoutes() {
  const location = useLocation()

  const pageVariants = {
    initial: {
      opacity: 0,
      x: 50
    },
    in: {
      opacity: 1,
      x: 0
    },
    out: {
      opacity: 0,
      x: -50
    }
  }

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="h-full w-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/calendario-dnd" element={<CalendarioDnd />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/historico" element={<Historico />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  return (
    <Router>
      <div className="flex h-screen w-screen text-gray-300">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={handleSidebarToggle} />
        <main className="flex-1 min-w-0 overflow-hidden">
          <AnimatedRoutes />
        </main>
      </div>
    </Router>
  )
}

export default App
