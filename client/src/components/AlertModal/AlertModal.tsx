import React from "react";
import "./AlertModal.scss";

interface AlertModalProps {
  show: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ show, message, onConfirm, onCancel, confirmText = "OK", cancelText = "Cancel" }) => {
  if (!show) return null;

  return (
    <div className='alert-modal-overlay'>
      <div className='alert-modal-container'>
        <div className='alert-modal-content'>
          <p className='alert-modal-message'>{message}</p>
        </div>

        <div className='alert-modal-actions'>
          {cancelText && (
            <button onClick={onCancel} className='alert-modal-button-cancel'>
              {cancelText}
            </button>
          )}
          <button id='confirmAlertButton' onClick={onConfirm} className='alert-modal-button-confirm'>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
