// Auth related constants
export const AUTH = {
  TOKEN_EXPIRY: process.env.JWT_EXPIRES_IN || '3600',
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_RESET_EXPIRY: 60 * 60 * 1000, // 1 hour
};

// User roles
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  COACH: 'coach',
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Geçersiz e-posta veya şifre.',
  SESSION_EXPIRED: 'Oturum süresi doldu. Lütfen tekrar giriş yapın.',
  UNAUTHORIZED: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.',
  FORBIDDEN: 'Bu işlemi gerçekleştirmek için yetkiniz yok.',
  USER_NOT_FOUND: 'Kullanıcı bulunamadı.',
  EMAIL_ALREADY_EXISTS: 'Bu e-posta adresi zaten kullanılıyor.',
  WEAK_PASSWORD: `Şifreniz en az ${8} karakter uzunluğunda olmalıdır.`,
  RATE_LIMIT_EXCEEDED: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Kayıt işlemi başarıyla tamamlandı.',
  LOGIN_SUCCESS: 'Giriş işlemi başarıyla tamamlandı.',
  LOGOUT_SUCCESS: 'Çıkış işlemi başarıyla tamamlandı.',
  PASSWORD_RESET_EMAIL_SENT: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
  PASSWORD_RESET_SUCCESS: 'Şifreniz başarıyla güncellendi.',
  VERIFICATION_EMAIL_SENT: 'Doğrulama bağlantısı e-posta adresinize gönderildi.',
}; 