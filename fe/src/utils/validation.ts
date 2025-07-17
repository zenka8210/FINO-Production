/**
 * Validate email format - SYNCED WITH BACKEND
 * Backend UserSchema regex: /^\S+@\S+\.\S+$/
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^\S+@\S+\.\S+$/; // Exact match with backend
  return emailRegex.test(email);
}

/**
 * Validate phone number (Vietnamese format) - SYNCED WITH BACKEND
 * Backend allows maxlength: 11, common format is 10-11 digits starting with 0
 */
export function isValidPhone(phone: string): boolean {
  // Sync with backend UserSchema: maxlength: 11, Vietnamese phone format
  const phoneRegex = /^0[0-9]{9,10}$/; // 0 + 9-10 digits = 10-11 total
  return phoneRegex.test(phone);
}

/**
 * Validate password strength - SYNCED WITH BACKEND
 * Backend UserSchema only requires minlength: 8, no other complexity rules
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) { // Sync with backend: minlength: 8
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }
  
  if (password.length > 128) { // Reasonable max length
    errors.push('Mật khẩu không được quá 128 ký tự');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate required field
 */
export function isRequired(value: any): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
}

/**
 * Validate min length
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return value.length >= minLength;
}

/**
 * Validate max length
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength;
}

/**
 * Validate number range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: number): boolean {
  return value > 0;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Escape special characters for regex
 */
export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate file type
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File, maxSizeInBytes: number): boolean {
  return file.size <= maxSizeInBytes;
}

/**
 * Generic form validator
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export function validateField(value: any, rules: ValidationRule): string[] {
  const errors: string[] = [];
  
  if (rules.required && !isRequired(value)) {
    errors.push('Trường này là bắt buộc');
  }
  
  if (value && typeof value === 'string') {
    if (rules.minLength && !hasMinLength(value, rules.minLength)) {
      errors.push(`Phải có ít nhất ${rules.minLength} ký tự`);
    }
    
    if (rules.maxLength && !hasMaxLength(value, rules.maxLength)) {
      errors.push(`Không được vượt quá ${rules.maxLength} ký tự`);
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push('Định dạng không hợp lệ');
    }
  }
  
  if (rules.custom) {
    const customResult = rules.custom(value);
    if (typeof customResult === 'string') {
      errors.push(customResult);
    } else if (!customResult) {
      errors.push('Giá trị không hợp lệ');
    }
  }
  
  return errors;
}

/**
 * Form validation interfaces and utilities
 */
export interface FormErrors {
  [key: string]: string;
}

/**
 * Validate login form - SYNCED WITH BACKEND
 */
export const validateLoginForm = (email: string, password: string): FormErrors => {
  const errors: FormErrors = {};
  
  if (!email) {
    errors.email = 'Email là bắt buộc';
  } else if (!isValidEmail(email)) {
    errors.email = 'Email không hợp lệ';
  }
  
  if (!password) {
    errors.password = 'Mật khẩu là bắt buộc';
  } else {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0]; // Show first error
    }
  }
  
  return errors;
};

/**
 * Validate register form - SYNCED WITH BACKEND
 */
export const validateRegisterForm = (
  name: string, 
  email: string, 
  password: string, 
  confirmPassword: string, 
  phone: string
): FormErrors => {
  const errors: FormErrors = {};
  
  // Name validation - sync with backend: maxlength: 60
  if (!name) {
    errors.name = 'Họ tên là bắt buộc';
  } else if (name.trim().length < 3) { // More realistic minimum for Vietnamese names
    errors.name = 'Họ tên phải có ít nhất 3 ký tự';
  } else if (name.length > 60) { // Sync with backend maxlength: 60
    errors.name = 'Họ tên không được quá 60 ký tự';
  }
  
  // Email validation - sync with backend regex
  if (!email) {
    errors.email = 'Email là bắt buộc';
  } else if (!isValidEmail(email)) {
    errors.email = 'Email không hợp lệ';
  }
  
  // Password validation - sync with backend minlength: 8
  if (!password) {
    errors.password = 'Mật khẩu là bắt buộc';
  } else {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0]; // Show first error
    }
  }
  
  // Confirm password validation
  if (!confirmPassword) {
    errors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
  }
  
  // Phone validation - sync with backend maxlength: 11, Vietnamese format
  if (!phone) {
    errors.phone = 'Số điện thoại là bắt buộc';
  } else if (phone.length > 11) { // Sync with backend maxlength: 11
    errors.phone = 'Số điện thoại không được quá 11 ký tự';
  } else if (!isValidPhone(phone)) {
    errors.phone = 'Số điện thoại không hợp lệ (10-11 chữ số, bắt đầu bằng 0)';
  }
  
  return errors;
};

/**
 * Check if form has any errors
 */
export const hasFormErrors = (errors: FormErrors): boolean => {
  return Object.keys(errors).length > 0;
};
