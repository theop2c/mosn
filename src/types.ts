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
  /** Jusqu'à 3 images PNG/JPEG (imageUrl : ancien champ, un seul visuel). */
  imageUrls?: string[];
  imageUrl?: string | null;
  createdAt?: Timestamp;
}

export interface AppSettings {
  /** Hébergement d'images via Firebase Storage (nécessite le plan Blaze). */
  imagesEnabled: boolean;
  /** Design actif (id d'un des 10 thèmes de src/styles/themes). */
  theme: string;
  /** Langue active (id d'un des dictionnaires de src/i18n). */
  language: string;
  /** Fil public visible sans être connecté. */
  publicFeed: boolean;
  /** Nombre de posts chargés par page (10/20/50/100). */
  pageSize: number;
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

export interface Invite {
  email: string;
  invitedBy: string;
  status: "sent" | "accepted";
  createdAt?: Timestamp;
  acceptedAt?: Timestamp;
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
