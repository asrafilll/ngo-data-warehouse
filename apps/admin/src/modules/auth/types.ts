export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  createdAt: string;
  updatedAt: string;
};

// identifier: email (local better-auth account) or phone number (approval-sip /
// sip.rekapdana.com account, verified via the external-auth bridge).
export type LoginInput = {
  identifier: string;
  password: string;
};

export type AuthResponse = {
  user: AuthUser;
  error?: string;
};
