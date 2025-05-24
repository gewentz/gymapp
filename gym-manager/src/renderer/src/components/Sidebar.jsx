import { NavLink } from 'react-router-dom'

function Sidebar({ isCollapsed, onToggle }) {
  return (
    <div
      className={`h-screen bg-stone-700 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col`}
    >
      <div className="flex items-center justify-between p-4 border-b border-stone-700">
        <h2 className="text-xl font-bold ">{isCollapsed ? 'RA' : 'Ricardo Alves Personal'}</h2>
        <button
          onClick={onToggle}
          className="text-white hover:bg-stone-700 p-1 rounded-md transition-colors"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      <nav className="mt-4 flex-1">
        <ul>
          <li className="mb-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 transition-colors ${
                  isActive ? 'bg-lime-600 text-white' : 'text-stone-300 hover:bg-stone-700'
                }`
              }
            >
              <span className="text-xl mr-3">📊</span>
              {!isCollapsed && <span className="truncate">Dashboard</span>}
            </NavLink>
          </li>
          <li className="mb-1">
            <NavLink
              to="/alunos"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 transition-colors ${
                  isActive ? 'bg-lime-600 text-white' : 'text-stone-300 hover:bg-stone-700'
                }`
              }
            >
              <span className="text-xl mr-3">👥</span>
              {!isCollapsed && <span className="truncate">Alunos</span>}
            </NavLink>
          </li>
          <li className="mb-1">
            <NavLink
              to="/calendario-dnd"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 transition-colors ${
                  isActive ? 'bg-lime-600 text-white' : 'text-stone-300 hover:bg-stone-700'
                }`
              }
            >
              <span className="text-xl mr-3">📅</span>
              {!isCollapsed && <span className="truncate">Calendário</span>}
            </NavLink>
          </li>
          <li className="mb-1">
            <NavLink
              to="/financeiro"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 transition-colors ${
                  isActive ? 'bg-lime-600 text-white' : 'text-stone-300 hover:bg-stone-700'
                }`
              }
            >
              <span className="text-xl mr-3">💰</span>
              {!isCollapsed && <span className="truncate">Financeiro</span>}
            </NavLink>
          </li>
          <li className="mb-1">
            <NavLink
              to="/historico"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 transition-colors ${
                  isActive ? 'bg-lime-600 text-white' : 'text-stone-300 hover:bg-stone-700'
                }`
              }
            >
              <span className="text-xl mr-3">📈</span>
              {!isCollapsed && <span className="truncate">Histórico</span>}
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="w-full p-4 border-t border-stone-700">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
          <div className="w-8 h-8 flex items-center justify-center text-white font-bold">
            V1.0.0
          </div>
          {!isCollapsed && <span className="ml-3 text-stone-300">Gabriel Wentz</span>}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
