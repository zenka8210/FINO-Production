/**
 * Format giá tiền theo định dạng VND
 * @param price - Giá tiền (number hoặc string)
 * @returns Chuỗi giá đã format theo VND
 */
export function formatPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '0đ';
  }
  
  return `${numPrice.toLocaleString('vi-VN')}đ`;
}

/**
 * Format giá tiền với đơn vị VNĐ đầy đủ
 * @param price - Giá tiền (number hoặc string) 
 * @returns Chuỗi giá đã format theo VNĐ
 */
export function formatPriceVND(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '0 VNĐ';
  }
  
  return `${numPrice.toLocaleString('vi-VN')} VNĐ`;
}

/**
 * Chuyển đổi giá từ string sang number
 * @param price - Giá tiền dạng string
 * @returns Giá tiền dạng number
 */
export function parsePrice(price: string | number): number {
  if (typeof price === 'number') {
    return price;
  }
  
  const cleaned = price.replace(/[^0-9]/g, '');
  return parseInt(cleaned) || 0;
}
