import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Heart,
  Copy,
  CheckCircle2,
  Globe,
  QrCode,
  ArrowRight,
} from "lucide-react";
import vippsImg from "../assets/vipps.jpeg";

type DonationAmount = 100 | 250 | 500 | 1000 | 2500 | 5000;

const BANK_INFO = {
  // Contact Info
  phone: "+47 966 94 706",
  email: "Uliberians1847@yahoo.com",
  
  // Local (Norway)
  accountNumber: "1503.50.51942",
  orgNumber: "992 826 363",
  vippsNumber: "75356",
  
  // International
  bankName: "DNB Bank ASA",
  accountName: "ULAN - Union of Liberian Associations in Norway",
  iban: "NO05 1503 5051 942",
  swiftBic: "DNBANOKK",
};

export default function Donate() {
  const [selectedAmount, setSelectedAmount] = useState<DonationAmount | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showVipps, setShowVipps] = useState(false);

  const amounts: DonationAmount[] = [100, 250, 500, 1000, 2500, 5000];

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const openContactModal = () => {
    window.dispatchEvent(new Event("contact:open"));
  };

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;

  return (
    <div className="donate-page">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">
            Support Our Mission
            <Heart size={48} className="hero-heart" fill="currentColor" />
          </h1>
          <p className="hero-subtitle">
            Your donation helps ULAN grow and continue supporting the Liberian community
            through education, healthcare, agriculture, and emergency relief programs.
          </p>
        </div>
      </section>

      <main className="donate-main">
        {/* Donation Amount Selection */}
        <section className="amount-section">
          <h2 className="section-title">
            <Heart size={28} />
            Choose Your Donation Amount
          </h2>

          <div className="amount-grid">
            {amounts.map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount("");
                }}
                className={`amount-button ${selectedAmount === amount ? "amount-button--active" : ""}`}
              >
                <span className="amount-value">{amount}</span>
                <span className="amount-currency">NOK</span>
              </button>
            ))}
          </div>

          <div className="custom-amount">
            <label className="custom-amount-label">Or enter a custom amount:</label>
            <div className="custom-amount-input-wrapper">
              <input
                type="number"
                min="1"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="custom-amount-input"
              />
              <span className="custom-amount-currency">NOK</span>
            </div>
          </div>

          {finalAmount && (
            <div className="donation-summary">
              <div className="summary-content">
                <Heart size={24} className="summary-heart" fill="currentColor" />
                <div>
                  <div className="summary-text">Your generous donation of</div>
                  <div className="summary-amount">{finalAmount} NOK</div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Why Your Donation Matters */}
        <section className="why-donate-section">
          <div className="why-donate-card">
            <h2 className="why-donate-title">Why Your Donation Matters</h2>
            
            <p className="why-donate-intro">
              As a small, dedicated association, every contribution helps us expand our reach and
              deepen our impact in the Liberian community. Your donation enables us to:
            </p>

            <div className="why-donate-list">
              <div className="why-donate-item">
                <div className="item-icon">📚</div>
                <div className="item-content">
                  <h3>Support Education</h3>
                  <p>Provide scholarships and educational resources for students in need</p>
                </div>
              </div>

              <div className="why-donate-item">
                <div className="item-icon">🏥</div>
                <div className="item-content">
                  <h3>Improve Healthcare</h3>
                  <p>Supply medical equipment and support healthcare facilities</p>
                </div>
              </div>

              <div className="why-donate-item">
                <div className="item-icon">🌾</div>
                <div className="item-content">
                  <h3>Develop Agriculture</h3>
                  <p>Promote sustainable farming and food security initiatives</p>
                </div>
              </div>

              <div className="why-donate-item">
                <div className="item-icon">🚨</div>
                <div className="item-content">
                  <h3>Emergency Relief</h3>
                  <p>Respond quickly to crises and support families in urgent need</p>
                </div>
              </div>
            </div>

            <p className="why-donate-footer">
              Your support helps us grow from a small association into a powerful force for positive
              change. Every contribution, no matter the size, makes a real difference in people's lives.
            </p>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="payment-section">
          <h2 className="section-title">
            <Globe size={28} />
            How to Donate
          </h2>

          <div className="payment-methods">
            {/* Local Bank Transfer (Norway) */}
            <div className="payment-card">
              <div className="payment-header">
                <div className="payment-badge payment-badge--local">Local</div>
                <h3 className="payment-title">Bank Transfer (Norway)</h3>
              </div>

              <p className="payment-description">
                For donations within Norway
              </p>

              <div className="bank-info-list">
                <BankInfoRow
                  label="Account Number"
                  value={BANK_INFO.accountNumber}
                  onCopy={() => copyToClipboard(BANK_INFO.accountNumber, "accountNumber")}
                  copied={copiedField === "accountNumber"}
                />
                <BankInfoRow
                  label="Organization Number"
                  value={BANK_INFO.orgNumber}
                  onCopy={() => copyToClipboard(BANK_INFO.orgNumber, "orgNumber")}
                  copied={copiedField === "orgNumber"}
                />
              </div>
            </div>

            {/* International Bank Transfer */}
            <div className="payment-card">
              <div className="payment-header">
                <div className="payment-badge payment-badge--international">International</div>
                <h3 className="payment-title">International Transfer</h3>
              </div>

              <p className="payment-description">
                For donations from outside Norway
              </p>

              <div className="bank-info-list">
                <BankInfoRow
                  label="Bank Name"
                  value={BANK_INFO.bankName}
                  onCopy={() => copyToClipboard(BANK_INFO.bankName, "bankName")}
                  copied={copiedField === "bankName"}
                />
                <BankInfoRow
                  label="Account Name"
                  value={BANK_INFO.accountName}
                  onCopy={() => copyToClipboard(BANK_INFO.accountName, "accountName")}
                  copied={copiedField === "accountName"}
                />
                <BankInfoRow
                  label="IBAN"
                  value={BANK_INFO.iban}
                  onCopy={() => copyToClipboard(BANK_INFO.iban, "iban")}
                  copied={copiedField === "iban"}
                />
                <BankInfoRow
                  label="SWIFT/BIC"
                  value={BANK_INFO.swiftBic}
                  onCopy={() => copyToClipboard(BANK_INFO.swiftBic, "swiftBic")}
                  copied={copiedField === "swiftBic"}
                />
              </div>
            </div>

            {/* Vipps */}
            <div className="payment-card payment-card--full">
              <div className="payment-header">
                <QrCode size={24} className="text-purple-500" />
                <h3 className="payment-title">Vipps (Norway)</h3>
              </div>

              <p className="vipps-description">
                For Norwegian residents, donate quickly using Vipps.
              </p>

              <div className="vipps-info">
                <div className="vipps-number">
                  <span className="vipps-label">Vipps Number:</span>
                  <button
                    onClick={() => copyToClipboard(BANK_INFO.vippsNumber, "vippsNumber")}
                    className="vipps-copy-btn"
                  >
                    <span className="vipps-value">{BANK_INFO.vippsNumber}</span>
                    {copiedField === "vippsNumber" ? (
                      <CheckCircle2 size={18} className="text-green-500" />
                    ) : (
                      <Copy size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowVipps(!showVipps)}
                className="vipps-qr-toggle"
              >
                {showVipps ? "Hide QR Code" : "Show QR Code"}
                <ArrowRight
                  size={18}
                  className={`transition-transform ${showVipps ? "rotate-90" : ""}`}
                />
              </button>

              {showVipps && (
                <div className="vipps-qr-container">
                  <img
                    src={vippsImg}
                    alt="Vipps QR Code"
                    className="vipps-qr-image"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="contact-section">
          <h3 className="contact-title">Questions About Donating?</h3>
          <p className="contact-text">
            We're here to help! If you have any questions about making a donation or
            want to learn more about our work, please don't hesitate to reach out.
          </p>
          <button onClick={openContactModal} className="contact-button">
            Contact Us
            <ArrowRight size={18} />
          </button>
        </section>
      </main>

      <Footer />
      <style>{css}</style>
    </div>
  );
}

function BankInfoRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="bank-info-row">
      <div className="bank-info-label">{label}</div>
      <div className="bank-info-value-wrapper">
        <div className="bank-info-value">{value}</div>
        <button onClick={onCopy} className="bank-info-copy" title="Copy to clipboard">
          {copied ? (
            <CheckCircle2 size={18} className="text-green-500" />
          ) : (
            <Copy size={18} />
          )}
        </button>
      </div>
    </div>
  );
}

const css = `
.donate-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.hero-section {
  position: relative;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
  overflow: hidden;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 50%, rgba(59, 130, 246, 0.3), transparent 60%),
              radial-gradient(circle at 70% 50%, rgba(139, 92, 246, 0.2), transparent 60%);
  animation: pulse 8s ease-in-out infinite;
}

.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  max-width: 800px;
  padding: 0 20px;
  animation: fadeInUp 0.8s ease;
}

.hero-title {
  font-size: clamp(28px, 5vw, 48px);
  font-weight: 900;
  color: white;
  margin: 0 0 16px;
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-heart {
  color: #f87171;
  animation: pulse 2s ease-in-out infinite;
}

.hero-subtitle {
  font-size: clamp(15px, 2vw, 18px);
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.donate-main {
  flex: 1;
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: 48px 20px 60px;
}

@media (max-width: 640px) {
  .donate-main {
    padding: 32px 16px 40px;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 26px;
  font-weight: 900;
  color: #0f172a;
  margin: 0 0 28px;
}

@media (max-width: 640px) {
  .section-title {
    font-size: 22px;
    margin-bottom: 20px;
  }
}

/* Amount Section */
.amount-section {
  margin-bottom: 48px;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 14px;
  margin-bottom: 28px;
}

.amount-button {
  background: white;
  border: 3px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.amount-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.amount-button:hover {
  border-color: #3b82f6;
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.2);
}

.amount-button--active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}

.amount-button--active::before {
  opacity: 1;
}

.amount-value {
  position: relative;
  font-size: 30px;
  font-weight: 900;
  color: #0f172a;
  z-index: 1;
}

.amount-button--active .amount-value,
.amount-button--active .amount-currency {
  color: white;
}

.amount-currency {
  position: relative;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  z-index: 1;
}

.custom-amount {
  max-width: 400px;
  margin: 0 auto;
}

.custom-amount-label {
  display: block;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 10px;
  font-size: 15px;
}

.custom-amount-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.custom-amount-input {
  flex: 1;
  padding: 14px 56px 14px 18px;
  border: 3px solid #e2e8f0;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 700;
  outline: none;
  transition: all 0.3s ease;
}

.custom-amount-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.custom-amount-currency {
  position: absolute;
  right: 18px;
  font-weight: 700;
  color: #64748b;
  font-size: 15px;
}

.donation-summary {
  margin-top: 28px;
  padding: 20px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 14px;
  border: 2px solid #fbbf24;
  animation: scaleIn 0.4s ease;
}

.summary-content {
  display: flex;
  align-items: center;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
}

.summary-heart {
  color: #dc2626;
}

.summary-text {
  font-size: 15px;
  color: #78350f;
  font-weight: 600;
}

.summary-amount {
  font-size: 28px;
  font-weight: 900;
  color: #78350f;
}

/* Why Donate Section */
.why-donate-section {
  margin-bottom: 48px;
}

.why-donate-card {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
  border-radius: 20px;
  padding: 40px 28px;
  color: white;
  position: relative;
  overflow: hidden;
}

.why-donate-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: pulse 4s ease-in-out infinite;
}

.why-donate-title {
  position: relative;
  font-size: 28px;
  font-weight: 900;
  margin: 0 0 20px;
  text-align: center;
}

@media (max-width: 640px) {
  .why-donate-title {
    font-size: 24px;
  }
}

.why-donate-intro {
  position: relative;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.7;
  font-size: 16px;
  margin: 0 0 32px;
  text-align: center;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.why-donate-list {
  position: relative;
  display: grid;
  gap: 20px;
  margin-bottom: 28px;
}

@media (min-width: 768px) {
  .why-donate-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

.why-donate-item {
  display: flex;
  gap: 16px;
  background: rgba(255, 255, 255, 0.08);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.why-donate-item:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-4px);
}

.item-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.item-content h3 {
  font-size: 17px;
  font-weight: 800;
  margin: 0 0 6px;
  color: white;
}

.item-content p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  margin: 0;
}

.why-donate-footer {
  position: relative;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.7;
  font-size: 16px;
  text-align: center;
  max-width: 700px;
  margin: 0 auto;
}

/* Payment Section */
.payment-section {
  margin-bottom: 48px;
}

.payment-methods {
  display: grid;
  gap: 24px;
}

@media (min-width: 768px) {
  .payment-methods {
    grid-template-columns: repeat(2, 1fr);
  }
}

.payment-card {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.05);
  border: 2px solid #f1f5f9;
}

.payment-card--full {
  grid-column: 1 / -1;
}

.payment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.payment-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payment-badge--local {
  background: #dbeafe;
  color: #1e40af;
}

.payment-badge--international {
  background: #fef3c7;
  color: #92400e;
}

.payment-title {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.payment-description {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.5;
}

.bank-info-list {
  display: grid;
  gap: 14px;
}

.bank-info-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

@media (max-width: 640px) {
  .bank-info-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}

.bank-info-label {
  font-weight: 700;
  color: #64748b;
  font-size: 13px;
}

.bank-info-value-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
}

.bank-info-value {
  font-weight: 700;
  color: #0f172a;
  font-size: 14px;
}

.bank-info-copy {
  background: #f1f5f9;
  border: none;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.bank-info-copy:hover {
  background: #e2e8f0;
  transform: scale(1.1);
}

.vipps-description {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 20px;
  font-size: 14px;
}

.vipps-info {
  background: #faf5ff;
  border: 2px solid #e9d5ff;
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 14px;
}

.vipps-number {
  margin-bottom: 0;
}

.vipps-label {
  display: block;
  font-weight: 600;
  color: #581c87;
  font-size: 13px;
  margin-bottom: 8px;
}

.vipps-copy-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 2px solid #c084fc;
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  justify-content: space-between;
}

.vipps-copy-btn:hover {
  background: #faf5ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.2);
}

.vipps-value {
  font-size: 22px;
  font-weight: 900;
  color: #581c87;
}

.vipps-qr-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.vipps-qr-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
}

.vipps-qr-container {
  margin-top: 16px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e9d5ff;
  animation: slideDown 0.3s ease;
}

.vipps-qr-image {
  width: 100%;
  height: auto;
  display: block;
  background: white;
}

/* Contact Section */
.contact-section {
  text-align: center;
  padding: 40px 28px;
  background: #f8fafc;
  border-radius: 16px;
}

.contact-title {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 14px;
}

.contact-text {
  color: #64748b;
  line-height: 1.7;
  max-width: 600px;
  margin: 0 auto 20px;
  font-size: 15px;
}

.contact-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 26px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 700;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  cursor: pointer;
  font-size: 15px;
}

.contact-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
  }
}
`;