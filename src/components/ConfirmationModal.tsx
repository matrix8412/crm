import { html } from 'htm/preact';

export const ConfirmationModal = ({ onConfirm, onCancel, title, message, confirmText, cancelText, confirmClass }) => {
  return html`
    <div class="modal-header">
      <h3>${title}</h3>
    </div>
    <div class="modal-body">
      <p>${message}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" onClick=${onCancel}>${cancelText || 'Cancel'}</button>
      <button type="button" class="btn ${confirmClass || 'btn-primary'}" onClick=${onConfirm}>${confirmText || 'Confirm'}</button>
    </div>
  `;
};