import { useState } from 'react';
import { voucherService } from '@/services/voucherService';
import { Voucher, CreateVoucherRequest, PaginatedResponse } from '@/types';

interface VoucherFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  isActive?: boolean;
}

export const useAdminVouchers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const getVouchers = async (filters?: VoucherFilters): Promise<PaginatedResponse<Voucher>> => {
    setLoading(true);
    setError(null);
    try {
      const response = await voucherService.getAdminVouchers(filters);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch vouchers';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createVoucher = async (voucherData: CreateVoucherRequest): Promise<Voucher> => {
    setLoading(true);
    setError(null);
    try {
      const voucher = await voucherService.createVoucher(voucherData);
      return voucher;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create voucher';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateVoucher = async (id: string, voucherData: Partial<CreateVoucherRequest>): Promise<Voucher> => {
    setLoading(true);
    setError(null);
    try {
      const voucher = await voucherService.updateVoucher(id, voucherData);
      return voucher;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update voucher';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteVoucher = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await voucherService.deleteVoucher(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete voucher';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleVoucherStatus = async (id: string): Promise<Voucher> => {
    setLoading(true);
    setError(null);
    try {
      const voucher = await voucherService.toggleVoucherStatus(id);
      return voucher;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to toggle voucher status';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getVoucherById = async (id: string): Promise<Voucher> => {
    setLoading(true);
    setError(null);
    try {
      const voucher = await voucherService.getAdminVoucherById(id);
      return voucher;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch voucher';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getVoucherStatistics = async (): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const statistics = await voucherService.getVoucherStatistics();
      return statistics;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch voucher statistics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    clearError,
    getVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    toggleVoucherStatus,
    getVoucherById,
    getVoucherStatistics,
  };
};
