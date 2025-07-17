import { useState, useCallback } from 'react';
import { Address } from '@/types';
import { addressService } from '@/services';

/**
 * Hook for address-related operations without global state.
 * Use this for fetching addresses when needed, not for storing them globally.
 */
export function useAddresses() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserAddresses = useCallback(async (): Promise<Address[]> => {
    try {
      setLoading(true);
      setError(null);
      const addresses = await addressService.getUserAddresses();
      return addresses;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAddressById = useCallback(async (id: string): Promise<Address> => {
    try {
      setLoading(true);
      setError(null);
      const address = await addressService.getAddressById(id);
      return address;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAddress = useCallback(async (addressData: any): Promise<Address> => {
    try {
      setLoading(true);
      setError(null);
      const address = await addressService.createAddress(addressData);
      return address;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAddress = useCallback(async (id: string, addressData: any): Promise<Address> => {
    try {
      setLoading(true);
      setError(null);
      const address = await addressService.updateAddress(id, addressData);
      return address;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAddress = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await addressService.deleteAddress(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const setDefaultAddress = useCallback(async (id: string): Promise<Address> => {
    try {
      setLoading(true);
      setError(null);
      const address = await addressService.setDefaultAddress(id);
      return address;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    getUserAddresses,
    getAddressById,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    clearError,
  };
}
