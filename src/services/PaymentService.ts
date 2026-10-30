import { PAYMENT_BANK_DETAILS } from '../constants';
import { PaymentStage, PaymentProof } from '../types';
import { formatRupiah } from '../lib/formatters';

export class PaymentService {
  getBankDetails() {
    return PAYMENT_BANK_DETAILS;
  }

  calculateRequiredDp(totalAmount: number): number {
    return totalAmount * 0.5;
  }

  calculateRemainingBalance(totalAmount: number, dpAmount: number): number {
    return Math.max(0, totalAmount - dpAmount);
  }

  formatPaymentSummary(stage: PaymentStage, amount: number, total: number) {
    const isFull = stage === 'pelunasan';
    return {
      stageLabel: isFull ? 'Pelunasan 100% (Lunas)' : 'Uang Muka (DP 50%)',
      amountFormatted: formatRupiah(amount),
      totalFormatted: formatRupiah(total),
      remainingFormatted: formatRupiah(Math.max(0, total - amount))
    };
  }

  isProofValid(proof: PaymentProof): boolean {
    return Boolean(proof.receipt_image && proof.amount > 0);
  }
}

export const paymentService = new PaymentService();
