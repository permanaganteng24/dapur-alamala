import { useState, useMemo } from 'react';
import { Menu } from '../types';
import { formatRupiah } from '../lib/formatters';

export function useOrderCalculator(initialMenu?: Menu | null, initialPortions: number = 20) {
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(initialMenu || null);
  const [portions, setPortions] = useState<number>(Math.max(10, initialPortions));

  const isTumpengBig = useMemo(() => {
    return selectedMenu?.category === 'tumpeng' && (selectedMenu?.price || 0) > 100000;
  }, [selectedMenu]);

  const totalAmount = useMemo(() => {
    if (!selectedMenu) return 0;
    if (isTumpengBig) {
      return selectedMenu.price * Math.max(1, Math.round(portions / 20));
    }
    return selectedMenu.price * portions;
  }, [selectedMenu, portions, isTumpengBig]);

  const dpAmount = totalAmount * 0.5;
  const remainingAmount = totalAmount - dpAmount;

  const incrementPortions = (step: number = 1) => {
    setPortions(prev => prev + step);
  };

  const decrementPortions = (step: number = 1) => {
    setPortions(prev => Math.max(10, prev - step));
  };

  return {
    selectedMenu,
    setSelectedMenu,
    portions,
    setPortions,
    incrementPortions,
    decrementPortions,
    totalAmount,
    dpAmount,
    remainingAmount,
    formattedTotal: formatRupiah(totalAmount),
    formattedDp: formatRupiah(dpAmount),
    formattedRemaining: formatRupiah(remainingAmount),
    isTumpengBig
  };
}
