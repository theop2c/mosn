import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  displayName: string;
  displayNameLower?: string;
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
  groupId?: string | null;
  imageUrl?: string | null;
  createdAt?: Timestamp;
}

export interface AppSettings {
  /** Hébergement d'images via Firebase Storage (nécessite le plan Blaze). */
  imagesEnabled: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt?: Timestamp;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  visibility: "public" | "private";
  ownerId: string;
  createdAt?: Timestamp;
}

export interface GroupMember {
  uid: string;
  role: "owner" | "member";
  joinedAt?: Timestamp;
}

export interface JoinRequest {
  uid: string;
  displayName: string;
  createdAt?: Timestamp;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage?: string;
  updatedAt?: Timestamp;
}

export interface DirectMessage {
  id: string;
  senderId: string;
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
