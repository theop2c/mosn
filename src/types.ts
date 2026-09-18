import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  displayName: string;
  bio?: string;
  photoURL?: string;
  role?: "admin" | "user";
  banned?: boolean;
  createdAt?: Timestamp;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt?: Timestamp;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt?: Timestamp;
}

export interface AdminUser {
  uid: string;
  email?: string;
  displayName?: string;
  disabled: boolean;
  admin: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  targetType: "post" | "comment" | "user";
  targetId: string;
  reason: string;
  reporterId: string;
  status: "open" | "resolved";
  createdAt?: Timestamp;
}
