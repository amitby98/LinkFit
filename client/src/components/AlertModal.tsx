import React from "react";

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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}>
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "90%",
          maxWidth: "450px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          animation: "fadeInScale 0.3s ease-out",
        }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <p style={{ fontSize: "1rem", color: "#555", marginTop: "10px" }}>{message}</p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "24px" }}>
          {cancelText && (
            <button
              onClick={onCancel}
              style={{
                padding: "10px 20px",
                backgroundColor: "#e0e0e0",
                color: "#333",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "500",
              }}>
              {cancelText}
            </button>
          )}
          <button
            id='confirmAlertButton'
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "500",
            }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
export default AlertModal;
