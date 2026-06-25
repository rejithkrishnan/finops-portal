/**
 * Auth Provider Interface — LDAP-ready abstraction.
 *
 * Phase 1: LocalAuthProvider (bcrypt + PostgreSQL)
 * Future:  LdapAuthProvider (swap in without changing any routes/controllers)
 */

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
  role: string;
}

export interface AuthProvider {
  /**
   * Validate credentials and return user info if valid.
   * Returns null if authentication fails.
   */
  authenticate(username: string, password: string): Promise<AuthUser | null>;

  /**
   * Get user by ID (for token refresh / session lookup).
   */
  getUserById(id: number): Promise<AuthUser | null>;

  /**
   * Create a new user (may not be supported by all providers).
   */
  createUser?(data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    role: string;
  }): Promise<AuthUser>;

  /**
   * Update user details.
   */
  updateUser?(id: number, data: Partial<{
    email: string;
    displayName: string;
    role: string;
    isActive: boolean;
  }>): Promise<AuthUser>;

  /**
   * Change password.
   */
  changePassword?(id: number, newPassword: string): Promise<void>;

  /**
   * List all users (admin function).
   */
  listUsers?(): Promise<AuthUser[]>;
}
