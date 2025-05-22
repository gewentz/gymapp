import { useEffect, useRef } from 'react'

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

  // Define o tamanho do modal
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  // Fecha o modal ao pressionar ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Impede rolagem do body
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'auto' // Restaura rolagem do body
    }
  }, [isOpen, onClose])

  // Fecha o modal ao clicar fora dele
  const handleBackdropClick = (e) => {
    if (closeOnClickOutside && modalRef.current && !modalRef.current.contains(e.target)) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900 bg-opacity-50 transition-opacity duration-300"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className={`${sizeClasses[size]} w-full bg-stone-100 rounded-lg shadow-xl transform transition-all duration-300 ease-in-out`}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-stone-300 bg-stone-700 text-white rounded-t-lg">
          <h3 className="text-xl font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="text-stone-300 hover:text-white transition-colors focus:outline-none"
            aria-label="Fechar"
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
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>

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
    <button onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </button>
  )
}

export default Modal
