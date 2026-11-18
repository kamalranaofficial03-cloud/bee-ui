export interface AccountDetails {
  id: number;
  firstName: string | null;
  lastName: string | null;
  username: string;
  contactNo: string | null;
}

export interface AccountApiResponse {
  body: AccountDetails | null;
  message?: unknown;
}
