
import { useEffect, useRef } from 'preact/hooks';
import { html } from 'htm/preact';

export const Modal = ({ children, onClose, customClass = '' }) => {
  const mouseDownOnOverlay = useRef(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      mouseDownOnOverlay.current = true;
    }
  };

  const handleMouseUp = (e) => {
    if (mouseDownOnOverlay.current && e.target === e.currentTarget) {
      onClose();
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
