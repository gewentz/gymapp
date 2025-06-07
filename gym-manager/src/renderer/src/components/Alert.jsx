import Modal from './Modal'

function AlertModal({ isOpen, onClose, title = 'Atenção', message, buttonText = 'OK' }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <Modal.Button variant="primary" onClick={onClose}>
          {buttonText}
        </Modal.Button>
      }
    >
      <div className="text-stone-700 text-base py-2">{message}</div>
    </Modal>
  )
}

export default AlertModal
