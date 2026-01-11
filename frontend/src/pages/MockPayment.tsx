import { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export function MockPayment() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async (success: boolean) => {
    setIsProcessing(true);
    setError('');

    try {
      await api.post(`/external-banking/${paymentId}/complete`, {
        status: success ? 'Success' : 'Failed'
      });
      window.close()
    } catch (err) {
      setError('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mock-payment-page">
      <div className="payment-card">
        <h1>Mock Payment</h1>
        <p>Payment ID: {paymentId}</p>
        {error && <div className="error-message">{error}</div>}
        <div className="payment-actions">
          <button
            onClick={() => handlePayment(true)}
            className="btn btn-success"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Simulate Success'}
          </button>
          <button
            onClick={() => handlePayment(false)}
            className="btn btn-danger"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Simulate Failure'}
          </button>
        </div>
      </div>
    </div>
  );
}
