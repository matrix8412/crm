
import { useEffect, useRef } from 'preact/hooks';
import { html } from 'htm/preact';

export const Modal = ({ children, onClose, customClass = '', isDirty = false, onConfirmClose = null }) => {
  const mouseDownOnOverlay = useRef(false);

  const handleCloseAttempt = () => {
    // If modal has unsaved changes and a confirmation handler is provided, call it
    // Otherwise, close directly
    if (isDirty && onConfirmClose) {
      onConfirmClose();
    } else {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        // Check isDirty and call appropriate handler
        if (isDirty && onConfirmClose) {
          onConfirmClose();
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, isDirty, onConfirmClose]);

  const handleMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      mouseDownOnOverlay.current = true;
    }
  };

  const handleMouseUp = (e) => {
    if (mouseDownOnOverlay.current && e.target === e.currentTarget) {
      handleCloseAttempt();
    }
    mouseDownOnOverlay.current = false;
  };

  const handleMouseLeave = () => {
    mouseDownOnOverlay.current = false;
  };

  return html`
    <div
      class="modal-overlay"
      onMouseDown=${handleMouseDown}
      onMouseUp=${handleMouseUp}
      onMouseLeave=${handleMouseLeave}
    >
      <div class="modal-content ${customClass}">
        ${children}
      </div>
    </div>
  `;
};
