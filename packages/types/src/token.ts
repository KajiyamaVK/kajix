export enum TokenType {
  EMAIL_CONFIRMATION = "EMAIL_CONFIRMATION",
  PASSWORD_RESET = "PASSWORD_RESET",
  EMAIL_CHANGE = "EMAIL_CHANGE",
  ACCESS_TOKEN = "ACCESS_TOKEN",
  REFRESH_TOKEN = "REFRESH_TOKEN",
}

export interface TmpToken {
  id: number;
  type: TokenType;
  emailFrom: string;
  emailTo: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
