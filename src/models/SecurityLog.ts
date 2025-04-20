export interface SecurityLog {
  id: string;
  type: 'login' | 'logout' | 'failed_attempt' | 'password_change' | 'user_update' | 'role_change' | 'permission_change';
  admin: string;
  ip: string;
  date: string;
  time: string;
  status: 'success' | 'warning' | 'error';
  action: string;
}

export interface SecurityLogFilters {
  searchQuery?: string;
  dateFilter?: string;
  actionType?: SecurityLog['type'];
  status?: SecurityLog['status'];
}

// Yeni log oluşturmak için kullanılacak tip
export interface CreateSecurityLogDTO {
  type: SecurityLog['type'];
  admin: string;
  ip: string;
  status: SecurityLog['status'];
  action: string;
} 