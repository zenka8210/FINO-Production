const { SHIPPING } = require('../config/constants');

/**
 * Utility class for calculating shipping fees based on address
 */
class ShippingUtils {
  /**
   * Calculate shipping fee based on address
   * @param {Object} address - Address object with city field
   * @returns {Number} Shipping fee
   */
  static calculateShippingFee(address) {
    if (!address || !address.city) {
      return SHIPPING.FEES.OTHER_LOCATIONS;
    }

    const city = address.city.trim().toLowerCase();
    const hcmCities = SHIPPING.CITIES.HCM.map(c => c.toLowerCase());
    
    // Check if the city is Ho Chi Minh City
    const isHCM = hcmCities.some(hcmCity => 
      city.includes(hcmCity) || hcmCity.includes(city)
    );

    return isHCM ? SHIPPING.FEES.HCM_INNER_CITY : SHIPPING.FEES.OTHER_LOCATIONS;
  }

  /**
   * Get shipping fee info for display
   * @param {Object} address - Address object with city field
   * @returns {Object} Shipping info object
   */
  static getShippingInfo(address) {
    const fee = this.calculateShippingFee(address);
    const isHCM = fee === SHIPPING.FEES.HCM_INNER_CITY;
    
    return {
      fee,
      location: isHCM ? 'Nội thành TP.HCM' : 'Ngoại thành/Tỉnh khác',
      description: isHCM 
        ? `Phí ship nội thành TP.HCM: ${fee.toLocaleString('vi-VN')}đ`
        : `Phí ship ngoại thành/tỉnh khác: ${fee.toLocaleString('vi-VN')}đ`
    };
  }

  /**
   * Format shipping fee for display
   * @param {Number} fee - Shipping fee
   * @returns {String} Formatted fee string
   */
  static formatShippingFee(fee) {
    return `${fee.toLocaleString('vi-VN')}đ`;
  }
}

module.exports = ShippingUtils;
