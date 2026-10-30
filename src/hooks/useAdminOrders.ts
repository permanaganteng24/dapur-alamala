import { useState, useEffect, useMemo } from 'react';
import { CateringRequest, RequestStatus } from '../types';
import { 
  fetchAllRequests, 
  subscribeToAllRequests, 
  updateRequestStatus, 
  verifyPaymentProof 
} from '../lib/supabase';

export function useAdminOrders() {
  const [requests, setRequests] = useState<CateringRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    let mounted = true;
    fetchAllRequests().then((data) => {
      if (mounted) {
        setRequests(data);
        setLoading(false);
      }
    });

    const unsubscribe = subscribeToAllRequests((updatedList) => {
      setRequests(updatedList);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const filteredRequests = useMemo(() => {
    if (activeTab === 'all' || activeTab === 'catalog' || activeTab === 'settings') return requests;
    if (activeTab === 'DP Dibayar') {
      return requests.filter(r => r.status === 'DP Dibayar' || r.payment_status === 'dp_paid');
    }
    if (activeTab === 'Lunas') {
      return requests.filter(r => r.status === 'Lunas' || r.payment_status === 'fully_paid');
    }
    return requests.filter(r => r.status === activeTab);
  }, [requests, activeTab]);

  const kpis = useMemo(() => {
    return {
      total: requests.length,
      baru: requests.filter(r => r.status === 'Baru').length,
      dpDibayar: requests.filter(r => r.status === 'DP Dibayar' || r.payment_status === 'dp_paid').length,
      lunas: requests.filter(r => r.status === 'Lunas' || r.payment_status === 'fully_paid').length
    };
  }, [requests]);

  const changeStatus = async (id: string, newStatus: RequestStatus) => {
    await updateRequestStatus(id, newStatus);
    const updated = await fetchAllRequests();
    setRequests(updated);
  };

  const verifyProof = async (orderId: string, proofId: string, isVerified: boolean) => {
    await verifyPaymentProof(orderId, proofId, isVerified);
    const updated = await fetchAllRequests();
    setRequests(updated);
  };

  return {
    requests,
    filteredRequests,
    loading,
    activeTab,
    setActiveTab,
    kpis,
    changeStatus,
    verifyProof,
    refreshOrders: async () => {
      setLoading(true);
      const data = await fetchAllRequests();
      setRequests(data);
      setLoading(false);
    }
  };
}
