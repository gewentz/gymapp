import { useEffect, useRef, useCallback } from 'react'

function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md', // sm, md, lg, xl
  closeOnClickOutside = true
}) {
  const modalRef = useRef(null)
  const backdropRef = useRef(null)
  const isOpenRef = useRef(isOpen)

  // Atualiza a ref quando isOpen muda
  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  // Define o tamanho do modal
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  // Função para forçar inputs editáveis
  const forceInputsEditable = useCallback(() => {
    if (!modalRef.current || !isOpenRef.current) return

    const inputs = modalRef.current.querySelectorAll('input, select, textarea')
    inputs.forEach(input => {
      // Remove atributos que podem bloquear edição
      input.removeAttribute('readonly')
      input.removeAttribute('disabled')

      // Força estilos que permitem interação
      input.style.pointerEvents = 'auto'
      input.style.userSelect = 'auto'
      input.style.webkitUserSelect = 'auto'

      // Remove qualquer classe que possa estar bloqueando
      input.classList.remove('pointer-events-none')

      // Garante que o input pode receber foco
      if (input.tabIndex < 0) {
        input.tabIndex = 0
      }
    })
  }, [])

  // Efeito principal para gerenciar o modal
  useEffect(() => {
    if (!isOpen) return

    // Bloqueia scroll do body
    document.body.style.overflow = 'hidden'

    // Múltiplas tentativas de tornar os inputs editáveis
    const timers = [
      setTimeout(forceInputsEditable, 50),
      setTimeout(forceInputsEditable, 150),
      setTimeout(forceInputsEditable, 300),
      setTimeout(forceInputsEditable, 500)
    ]

    // Event listener para ESC
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)

    // Event listener para quando a janela ganha foco
    const handleWindowFocus = () => {
      if (isOpenRef.current) {
        setTimeout(forceInputsEditable, 100)
      }
    }
    window.addEventListener('focus', handleWindowFocus)

    // Event listener para cliques no documento
    const handleDocumentClick = () => {
      if (isOpenRef.current) {
        setTimeout(forceInputsEditable, 50)
      }
    }
    document.addEventListener('click', handleDocumentClick)

    return () => {
      // Limpa timers
      timers.forEach(timer => clearTimeout(timer))

      // Remove event listeners
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('click', handleDocumentClick)

      // Restaura scroll do body
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose, forceInputsEditable])

  // Fecha o modal ao clicar fora dele
  const handleBackdropClick = (e) => {
    if (closeOnClickOutside && e.target === backdropRef.current) {
      onClose()
    }
  }

  // Previne propagação de eventos do modal
  const handleModalClick = (e) => {
    e.stopPropagation()
    // Força inputs editáveis ao clicar no modal
    setTimeout(forceInputsEditable, 10)
  }

  // Handler para quando qualquer input recebe foco
  const handleInputInteraction = useCallback((e) => {
    const target = e.target

    // Remove atributos bloqueadores
    target.removeAttribute('readonly')
    target.removeAttribute('disabled')

    // Força estilos de interação
    target.style.pointerEvents = 'auto'
    target.style.userSelect = 'auto'
    target.style.webkitUserSelect = 'auto'

    // Se for um input de texto, garante que o cursor apareça
    if (target.type === 'text' || target.type === 'email' || target.type === 'tel' || target.tagName === 'TEXTAREA') {
      target.focus()
    }
  }, [])

  if (!isOpen) return null

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
      onClick={handleBackdropClick}
      onMouseDown={forceInputsEditable}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className={`${sizeClasses[size]} w-full bg-stone-100 rounded-lg shadow-xl transform transition-all duration-300 ease-in-out relative`}
        onClick={handleModalClick}
        onMouseDown={forceInputsEditable}
        tabIndex={-1}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-stone-300 bg-stone-700 text-white rounded-t-lg">
          <h3 className="text-xl font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="text-stone-300 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            aria-label="Fechar"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div
          className="p-6 max-h-[70vh] overflow-y-auto relative"
          onFocus={handleInputInteraction}
          onMouseDown={handleInputInteraction}
          onClick={forceInputsEditable}
        >
          {children}
        </div>

        {/* Rodapé do Modal (opcional) */}
        {footer && (
          <div className="flex justify-end gap-2 p-4 border-t border-stone-300 bg-stone-200 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// Componentes auxiliares para o rodapé do modal
Modal.Button = function ModalButton({ children, onClick, variant = 'primary', className = '' }) {
  const baseClasses =
    'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variantClasses = {
    primary: 'bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500',
    secondary: 'bg-stone-600 hover:bg-stone-700 text-white focus:ring-stone-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    outline:
      'bg-transparent border border-stone-300 hover:bg-stone-100 text-stone-700 focus:ring-stone-500'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export default Modal
