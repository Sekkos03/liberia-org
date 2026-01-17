import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Heart, Sparkles } from "lucide-react";

export default function DonationPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show popup after 5 seconds on every page load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="donation-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Popup */}
      <div className="donation-popup-container">
        <div
          className="donation-popup"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="donation-title"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="donation-close-btn"
            aria-label="Close donation popup"
            type="button"
          >
            <X size={20} />
          </button>

          {/* Sparkle Decoration */}
          <div className="donation-sparkle">
            <Sparkles size={24} />
          </div>

          {/* Content */}
          <div className="donation-content">
            {/* Icon */}
            <div className="donation-heart-icon">
              <Heart size={40} fill="white" />
            </div>

            {/* Title */}
            <h2 id="donation-title" className="donation-title">
              Make a Difference Today
            </h2>

            {/* Subtitle */}
            <p className="donation-subtitle">
              Your generous donation helps us continue our vital work in supporting the
              Liberian community through education, healthcare, and development projects.
            </p>

            {/* CTA Buttons */}
            <div className="donation-actions">
              <Link
                to="/donate"
                onClick={handleClose}
                className="donation-btn-primary"
              >
                <span className="donation-btn-gradient" />
                <span className="donation-btn-text">Donate Now</span>
                <Heart size={20} className="donation-btn-heart" />
              </Link>

              <button
                onClick={handleClose}
                className="donation-btn-later"
                type="button"
              >
                Maybe later
              </button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="donation-gradient-bottom" />
        </div>
      </div>

      <style>{css}</style>
    </>
  );
}

const css = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounceGentle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

/* Backdrop */
.donation-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9998;
  animation: fadeIn 0.3s ease;
  cursor: pointer;
}

/* Popup Container */
.donation-popup-container {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  pointer-events: none;
}

/* Popup */
.donation-popup {
  position: relative;
  width: min(600px, 92vw);
  background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  animation: slideUp 0.4s ease;
  border: 2px solid rgba(255, 255, 255, 0.1);
  pointer-events: auto;
}

.donation-popup::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: pulse 3s ease-in-out infinite;
  pointer-events: none;
}

/* Close Button */
.donation-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  color: white;
  backdrop-filter: blur(4px);
}

.donation-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.donation-close-btn:focus {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

/* Sparkle */
.donation-sparkle {
  position: absolute;
  top: 24px;
  left: 24px;
  color: #fde047;
  animation: pulse 2s ease-in-out infinite;
  pointer-events: none;
}

/* Content */
.donation-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 32px 24px;
}

/* Heart Icon */
.donation-heart-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ef4444 0%, #ec4899 100%);
  margin-bottom: 24px;
  animation: bounceGentle 2s ease-in-out infinite;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  color: white;
}

/* Title */
.donation-title {
  font-size: clamp(28px, 5vw, 36px);
  font-weight: 900;
  color: white;
  margin: 0 0 12px;
  line-height: 1.2;
  animation: slideDown 0.5s ease;
}

/* Subtitle */
.donation-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(16px, 2vw, 18px);
  margin: 0 0 24px;
  max-width: 450px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  animation: slideUp 0.5s ease;
}

/* Actions */
.donation-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  align-items: center;
  animation: slideUp 0.5s ease 0.2s both;
}

@media (min-width: 640px) {
  .donation-actions {
    flex-direction: row;
  }
}

/* Primary Button */
.donation-btn-primary {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  background: white;
  color: #122346;
  border-radius: 12px;
  font-weight: 700;
  font-size: 18px;
  text-decoration: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;
  cursor: pointer;
}

.donation-btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
}

.donation-btn-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.donation-btn-primary:hover .donation-btn-gradient {
  opacity: 1;
}

.donation-btn-text,
.donation-btn-heart {
  position: relative;
  z-index: 1;
}

.donation-btn-primary:hover .donation-btn-heart {
  fill: currentColor;
}

/* Later Button */
.donation-btn-later {
  padding: 12px 24px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.donation-btn-later:hover {
  color: white;
}

/* Gradient Bottom */
.donation-gradient-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 128px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.3), transparent);
  pointer-events: none;
}
`;