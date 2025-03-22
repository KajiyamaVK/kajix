// src/users/dto/user.dto.ts
export class UserDto {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}
