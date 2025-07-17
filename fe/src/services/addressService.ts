import { apiClient } from '@/lib/api';
import { 
  Address, 
  CreateAddressRequest, 
  ApiResponse 
} from '@/types';

interface AddressValidationRequest {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  district: string;
  ward: string;
}

interface AddressValidationResponse {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  formattedAddress?: string;
  suggestions?: {
    city?: string[];
    district?: string[];
    ward?: string[];
  };
}

interface CityResponse {
  cities: string[];
  totalCities: number;
}

interface InputGuidance {
  tips: string[];
  examples: {
    fullName: string[];
    phone: string[];
    addressLine: string[];
    city: string[];
    district: string[];
    ward: string[];
  };
  validation: {
    fullName: {
      minLength: number;
      maxLength: number;
      pattern?: string;
    };
    phone: {
      pattern: string;
      examples: string[];
    };
    addressLine: {
      minLength: number;
      maxLength: number;
      tips: string[];
    };
  };
}

export class AddressService {
  private static instance: AddressService;

  private constructor() {}

  public static getInstance(): AddressService {
    if (!AddressService.instance) {
      AddressService.instance = new AddressService();
    }
    return AddressService.instance;
  }

  // ========== PUBLIC ENDPOINTS ==========

  /**
   * Get valid cities list (Public)
   */
  async getValidCities(): Promise<CityResponse> {
    try {
      const response = await apiClient.get<CityResponse>('/api/addresses/cities');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cities');
    }
  }

  /**
   * Get address input guidance (Public)
   */
  async getInputGuidance(): Promise<InputGuidance> {
    try {
      const response = await apiClient.get<InputGuidance>('/api/addresses/guidance');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch input guidance');
    }
  }

  /**
   * Validate and preview address (Public)
   */
  async validateAndPreview(addressData: AddressValidationRequest): Promise<AddressValidationResponse> {
    try {
      const response = await apiClient.post<AddressValidationResponse>('/api/addresses/validate', addressData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate address');
    }
  }

  // ========== USER ADDRESS MANAGEMENT ==========

  /**
   * Create user address
   */
  async createAddress(addressData: CreateAddressRequest): Promise<Address> {
    try {
      const response = await apiClient.post<Address>('/api/addresses', addressData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create address');
    }
  }

  /**
   * Get user addresses
   */
  async getUserAddresses(): Promise<Address[]> {
    try {
      const response = await apiClient.get<Address[]>('/api/addresses');
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch addresses');
    }
  }

  /**
   * Get address by ID
   */
  async getAddressById(id: string): Promise<Address> {
    try {
      const response = await apiClient.get<Address>(`/api/addresses/${id}`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch address');
    }
  }

  /**
   * Update address
   */
  async updateAddress(id: string, addressData: Partial<CreateAddressRequest>): Promise<Address> {
    try {
      const response = await apiClient.put<Address>(`/api/addresses/${id}`, addressData);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update address');
    }
  }

  /**
   * Delete address
   */
  async deleteAddress(id: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.delete(`/api/addresses/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete address');
    }
  }

  /**
   * Set default address
   */
  async setDefaultAddress(id: string): Promise<Address> {
    try {
      const response = await apiClient.patch<Address>(`/api/addresses/${id}/set-default`);
      return response.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to set default address');
    }
  }

  /**
   * Delete address with replacement
   */
  async deleteAddressWithReplacement(id: string, replacementAddressId?: string): Promise<ApiResponse<any>> {
    try {
      const url = replacementAddressId 
        ? `/api/addresses/${id}/with-replacement?replacementAddressId=${replacementAddressId}`
        : `/api/addresses/${id}/with-replacement`;
      return await apiClient.delete(url);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete address with replacement');
    }
  }
}

// Create and export singleton instance
export const addressService = AddressService.getInstance();
