/**
 * Address Validation Utility
 * Validates Vietnamese address components (city, district, ward)
 * Supports common Vietnamese address abbreviations for user convenience
 */

// Danh sách tỉnh/thành phố Việt Nam đầy đủ
const VALID_CITIES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Thành phố Hồ Chí Minh', 'Hồ Chí Minh', 'TPHCM',
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

// Từ viết tắt thành phố/tỉnh
const CITY_ABBREVIATIONS = {
  'tp': 'Thành phố',
  'tp.': 'Thành phố',
  'tphcm': 'TP. Hồ Chí Minh',
  'hcm': 'TP. Hồ Chí Minh',
  'hn': 'Hà Nội',
  'dn': 'Đà Nẵng',
  'hp': 'Hải Phòng',
  'ct': 'Cần Thơ'
};

// Từ viết tắt quận/huyện
const DISTRICT_ABBREVIATIONS = {
  'q': 'Quận',
  'q.': 'Quận',
  'qu': 'Quận',
  'quan': 'Quận',
  'h': 'Huyện',
  'h.': 'Huyện',
  'huyen': 'Huyện',
  'tx': 'Thị xã',
  'tx.': 'Thị xã',
  'tt': 'Thị trấn',
  'tt.': 'Thị trấn'
};

// Từ viết tắt phường/xã
const WARD_ABBREVIATIONS = {
  'p': 'Phường',
  'p.': 'Phường',
  'phuong': 'Phường',
  'x': 'Xã',
  'x.': 'Xã',
  'xa': 'Xã',
  'tt': 'Thị trấn',
  'tt.': 'Thị trấn'
};

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
   * Normalize and expand abbreviations in text
   * @param {string} text - Text to normalize
   * @param {object} abbreviations - Abbreviation mapping
   * @returns {string} - Normalized text
   */
  static normalizeText(text, abbreviations) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    let normalized = text.trim();
    
    // Convert to lowercase for comparison
    const lowerText = normalized.toLowerCase();
    
    // Check for abbreviations and expand them
    for (const [abbr, full] of Object.entries(abbreviations)) {
      const abbrLower = abbr.toLowerCase();
      
      // Handle exact matches and word boundary matches
      if (lowerText === abbrLower) {
        return full;
      }
      
      // Handle abbreviations at the beginning of text
      if (lowerText.startsWith(abbrLower + ' ')) {
        return full + normalized.substring(abbr.length);
      }
      
      // Handle abbreviations followed by numbers (e.g., "q1" -> "Quận 1")
      const numberMatch = lowerText.match(new RegExp(`^${abbrLower}(\\d+)$`));
      if (numberMatch) {
        return `${full} ${numberMatch[1]}`;
      }
      
      // Handle abbreviations followed by numbers with space (e.g., "q 1" -> "Quận 1")
      const spaceNumberMatch = lowerText.match(new RegExp(`^${abbrLower}\\s+(\\d+)$`));
      if (spaceNumberMatch) {
        return `${full} ${spaceNumberMatch[1]}`;
      }
    }
    
    return normalized;
  }

  /**
   * Validate and normalize city/province name
   * @param {string} city - City name to validate
   * @returns {object} - Validation result with normalized name
   */
  static validateCity(city) {
    if (!city || typeof city !== 'string') {
      return { isValid: false, normalized: '', suggestion: 'Vui lòng nhập tên tỉnh/thành phố' };
    }
    
    const normalized = this.normalizeText(city, CITY_ABBREVIATIONS);
    
    // Check if normalized city is in the valid list (case insensitive)
    const matchedCity = VALID_CITIES.find(validCity => 
      normalized.toLowerCase() === validCity.toLowerCase()
    );
    
    if (matchedCity) {
      return { isValid: true, normalized: matchedCity };
    }
    
    // Suggest similar cities
    const suggestions = VALID_CITIES.filter(validCity =>
      validCity.toLowerCase().includes(normalized.toLowerCase()) ||
      normalized.toLowerCase().includes(validCity.toLowerCase())
    ).slice(0, 3);
    
    return {
      isValid: false,
      normalized,
      suggestion: suggestions.length > 0 
        ? `Có thể bạn muốn nhập: ${suggestions.join(', ')}`
        : 'Tỉnh/thành phố không hợp lệ. Ví dụ: "hn" → "Hà Nội", "tphcm" → "TP. Hồ Chí Minh"'
    };
  }

  /**
   * Validate and normalize district name
   * @param {string} district - District name to validate
   * @returns {object} - Validation result with normalized name
   */
  static validateDistrict(district) {
    if (!district || typeof district !== 'string') {
      return { isValid: false, normalized: '', suggestion: 'Vui lòng nhập tên quận/huyện' };
    }
    
    const normalized = this.normalizeText(district, DISTRICT_ABBREVIATIONS);
    
    // Check if district has valid keyword
    const hasValidKeyword = DISTRICT_KEYWORDS.some(keyword =>
      normalized.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Check if it's a valid pattern (at least 2 characters)
    const hasProperLength = normalized.length >= 2 && normalized.length <= 50;
    
    if (hasValidKeyword || hasProperLength) {
      return { isValid: true, normalized };
    }
    
    return {
      isValid: false,
      normalized,
      suggestion: 'Ví dụ: "q1" → "Quận 1", "h.donga" → "Huyện Đống Đa"'
    };
  }

  /**
   * Validate and normalize ward name
   * @param {string} ward - Ward name to validate
   * @returns {object} - Validation result with normalized name
   */
  static validateWard(ward) {
    if (!ward || typeof ward !== 'string') {
      return { isValid: false, normalized: '', suggestion: 'Vui lòng nhập tên phường/xã' };
    }
    
    const normalized = this.normalizeText(ward, WARD_ABBREVIATIONS);
    
    // Check if ward has valid keyword
    const hasValidKeyword = WARD_KEYWORDS.some(keyword =>
      normalized.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Check if it's a valid pattern (at least 2 characters)
    const hasProperLength = normalized.length >= 2 && normalized.length <= 50;
    
    if (hasValidKeyword || hasProperLength) {
      return { isValid: true, normalized };
    }
    
    return {
      isValid: false,
      normalized,
      suggestion: 'Ví dụ: "p1" → "Phường 1", "x.tanbien" → "Xã Tân Biên"'
    };
  }

  /**
   * Validate full address object with normalization
   * @param {object} addressData - Address data to validate
   * @returns {object} - Validation result with details and normalized data
   */
  static validateAddress(addressData) {
    const errors = [];
    const normalizedData = {};
    const suggestions = [];
    
    // Validate city
    const cityField = addressData.city || addressData.province;
    const cityValidation = this.validateCity(cityField);
    if (!cityValidation.isValid) {
      errors.push(`Tỉnh/Thành phố: ${cityValidation.suggestion}`);
    } else {
      normalizedData.city = cityValidation.normalized;
    }
    
    // Validate district
    const districtValidation = this.validateDistrict(addressData.district);
    if (!districtValidation.isValid) {
      errors.push(`Quận/Huyện: ${districtValidation.suggestion}`);
    } else {
      normalizedData.district = districtValidation.normalized;
    }
    
    // Validate ward
    const wardValidation = this.validateWard(addressData.ward);
    if (!wardValidation.isValid) {
      errors.push(`Phường/Xã: ${wardValidation.suggestion}`);
    } else {
      normalizedData.ward = wardValidation.normalized;
    }
    
    // Validate required fields
    if (!addressData.fullName || addressData.fullName.trim().length < 2) {
      errors.push('Họ tên người nhận phải có ít nhất 2 ký tự');
    }
    
    if (!addressData.phone || !/^[0-9+\-\s()]{10,15}$/.test(addressData.phone.trim())) {
      errors.push('Số điện thoại không hợp lệ (10-15 số)');
    }
    
    if (!addressData.addressLine || addressData.addressLine.trim().length < 5) {
      errors.push('Địa chỉ chi tiết phải có ít nhất 5 ký tự');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      normalizedData,
      suggestions: [
        'Mẹo: Bạn có thể dùng viết tắt như "q1" thay vì "Quận 1"',
        'Ví dụ: "p.bennghe, q1, tphcm" sẽ được hiểu là "Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"'
      ]
    };
  }

  /**
   * Get list of valid cities with examples
   * @returns {object} - Cities and abbreviation examples
   */
  static getValidCities() {
    return {
      cities: [...VALID_CITIES],
      abbreviationExamples: {
        'Hà Nội': ['hn', 'hanoi'],
        'TP. Hồ Chí Minh': ['tphcm', 'hcm', 'tp.hcm'],
        'Đà Nẵng': ['dn', 'danang'],
        'Cần Thơ': ['ct', 'cantho'],
        'Hải Phòng': ['hp', 'haiphong']
      },
      commonPatterns: [
        'Quận: q1, q.1, quan 1',
        'Huyện: h.dongda, huyen dong da',
        'Phường: p1, p.bennghe, phuong 1',
        'Xã: x.tanbien, xa tan bien'
      ]
    };
  }

  /**
   * Get address input guidance
   * @returns {object} - Input guidance and examples
   */
  static getInputGuidance() {
    return {
      city: {
        placeholder: 'VD: Hà Nội, TPHCM, hn, tphcm',
        examples: ['Hà Nội', 'TP. Hồ Chí Minh', 'hn', 'tphcm'],
        tips: 'Có thể viết tắt: hn = Hà Nội, tphcm = TP. Hồ Chí Minh'
      },
      district: {
        placeholder: 'VD: Quận 1, q1, Huyện Đống Đa, h.dongda',
        examples: ['Quận 1', 'q1', 'Huyện Đống Đa', 'h.dongda'],
        tips: 'Có thể viết tắt: q1 = Quận 1, h.dongda = Huyện Đống Đa'
      },
      ward: {
        placeholder: 'VD: Phường 1, p1, Xã Tân Biên, x.tanbien',
        examples: ['Phường 1', 'p1', 'Xã Tân Biên', 'x.tanbien'],
        tips: 'Có thể viết tắt: p1 = Phường 1, x.tanbien = Xã Tân Biên'
      }
    };
  }
}

module.exports = AddressValidator;
