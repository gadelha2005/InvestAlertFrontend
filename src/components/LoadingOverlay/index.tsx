import "./LoadingOverlay.css";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export default function LoadingOverlay({
  isVisible,
  message = "Processando...",
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="loading-spinner__circle"></div>
        <p className="loading-spinner__text">{message}</p>
      </div>
    </div>
  );
}
