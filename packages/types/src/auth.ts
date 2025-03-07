/**
 * Authentication-related types
 */

/**
 * Login credentials
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Refresh token DTO
 */
export interface RefreshTokenDto {
  refreshToken: string;
}

/**
 * JWT payload structure
 */
export interface TokenPayload {
  sub: number;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
  type?: "access" | "refresh";
}

/**
 * Login response containing tokens
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

/**
 * User information extracted from JWT
 */
export interface UserFromJwt {
  id: number;
  username: string;
  email: string;
}
