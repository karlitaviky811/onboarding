export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export interface AuthToken {
  accessToken: string;
  expiresAt: number;
}
