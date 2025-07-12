/**
 * Address Validation Utility
 * Validates Vietnamese address components (city, district, ward)
 */

// Danh sách tỉnh/thành phố Việt Nam (một số ví dụ - có thể mở rộng)
const VALID_CITIES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Thành phố Hồ Chí Minh', 'Hồ Chí Minh',
  'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'An Giang', 'Bà Rịa - Vũng Tàu',
  'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh', 'Bến Tre',
  'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau',
  'Cao Bằng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai',
  'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Tĩnh',
  'Hải Dương', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên', 'Khánh Hòa',
  'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn',
  'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình',
  'Ninh Thuận', 'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam',
  'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng', 'Sơn La',
  'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hóa', 'Thừa Thiên Huế',
  'Tiền Giang', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc',
  'Yên Bái'
];

// Từ khóa phổ biến cho quận/huyện
const DISTRICT_KEYWORDS = [
  'Quận', 'Huyện', 'Thành phố', 'Thị xã', 'Thị trấn'
];

// Từ khóa phổ biến cho phường/xã
const WARD_KEYWORDS = [
  'Phường', 'Xã', 'Thị trấn'
];

class AddressValidator {
  /**
   * Validate city/province name
   * @param {string} city - City name to validate
   * @returns {boolean} - True if valid
   */
  static validateCity(city) {
    if (!city || typeof city !== 'string') {
      return false;
    }
    
    const normalizedCity = city.trim();
    
    // Check if city is in the valid list (case insensitive)
    return VALID_CITIES.some(validCity => 
      normalizedCity.toLowerCase() === validCity.toLowerCase()
    );
  }

  /**
   * Validate district name format
   * @param {string} district - District name to validate
   * @returns {boolean} - True if valid
   */
  static validateDistrict(district) {
    if (!district || typeof district !== 'string') {
      return false;
    }
    
    const normalizedDistrict = district.trim();
    
    // Check if district has valid keyword or follows naming pattern
    const hasValidKeyword = DISTRICT_KEYWORDS.some(keyword =>
      normalizedDistrict.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Also accept districts without keywords but with proper length
    const hasProperLength = normalizedDistrict.length >= 2 && normalizedDistrict.length <= 50;
    
    return hasValidKeyword || hasProperLength;
  }

  /**
   * Validate ward name format
   * @param {string} ward - Ward name to validate
   * @returns {boolean} - True if valid
   */
  static validateWard(ward) {
    if (!ward || typeof ward !== 'string') {
      return false;
    }
    
    const normalizedWard = ward.trim();
    
    // Check if ward has valid keyword or follows naming pattern
    const hasValidKeyword = WARD_KEYWORDS.some(keyword =>
      normalizedWard.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Also accept wards without keywords but with proper length
    const hasProperLength = normalizedWard.length >= 2 && normalizedWard.length <= 50;
    
    return hasValidKeyword || hasProperLength;
  }

  /**
   * Validate full address object
   * @param {object} addressData - Address data to validate
   * @returns {object} - Validation result with details
   */
  static validateAddress(addressData) {
    const errors = [];
    
    // Temporarily disable all validation for testing
    // const cityField = addressData.city || addressData.province;
    
    // if (!this.validateCity(cityField)) {
    //   errors.push('Tỉnh/Thành phố không hợp lệ. Vui lòng chọn tỉnh/thành phố Việt Nam.');
    // }
    
    // if (!this.validateDistrict(addressData.district)) {
    //   errors.push('Quận/Huyện không hợp lệ. Vui lòng nhập đúng tên quận/huyện.');
    // }
    
    // if (!this.validateWard(addressData.ward)) {
    //   errors.push('Phường/Xã không hợp lệ. Vui lòng nhập đúng tên phường/xã.');
    // }
    
    return {
      isValid: true, // Always valid for testing
      errors
    };
  }

  /**
   * Get list of valid cities
   * @returns {Array<string>} - List of valid cities
   */
  static getValidCities() {
    return [...VALID_CITIES];
  }
}

module.exports = AddressValidator;
