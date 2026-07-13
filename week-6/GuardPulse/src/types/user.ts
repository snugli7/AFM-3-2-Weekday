export type UserRole = "wearer" | "guardian" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyConnection {
  id: string;
  wearer_id: string;
  guardian_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}
