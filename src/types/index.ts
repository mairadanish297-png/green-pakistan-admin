export interface User {
  uid: string;
  fullName: string;
  email?: string;
  score: number;
  treesPlanted: number;
  isBanned: boolean;
  isVerified: boolean;
  country: string;
  role: string;
  createdAt?: any;
}

export interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  latitude: number;
  longitude: number;
  timestamp: any;
  country: string;
}

export interface Tree {
  id: string;
  treeName: string;
  species: string;
  healthStatus: string;
  imageUrl: string;
  lat: number;
  lng: number;
  ownerId: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: "Reminder" | "Social" | "Milestone";
  isRead: boolean;
  timestamp: any;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  coinReward: number;
  totalRequired: number;
  expiryDate: string;
}

export interface Event {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  imageUrl: string;
  attendeesCount: number;
}

export interface RewardClaim {
  id: string;
  userId: string;
  rewardId: string;
  address: string;
  status: "pending" | "shipped" | "delivered";
  timestamp: any;
}

export interface Certificate {
  id: string;
  userId: string;
  certificateNumber?: string;
  title?: string;
  imageUrl?: string;
  pdfUrl?: string;
  issuedAt?: any;
}