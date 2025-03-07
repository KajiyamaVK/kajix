/**
 * User-related types
 */

/**
 * Basic user data structure
 */
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data used for creating users in factories
 */
export interface UserFactoryData {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}

/**
 * Data required to create a new user
 */
export interface CreateUserDto {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

/**
 * Data for updating a user
 */
export interface UpdateUserDto {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}
