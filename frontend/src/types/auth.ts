export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
