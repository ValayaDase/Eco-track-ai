export interface IReport {
  _id?: string;
  userId: string;
  week?: string; // e.g. "2026-W25"
  month?: string; // e.g. "2026-06"
  summary: string;
  recommendations: string[];
  createdAt: Date;
}

export interface IChallenge {
  _id: string;
  title: string;
  description: string;
  points: number;
}

export interface IBadge {
  _id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name or image path
}

export interface IUserChallengeProgress {
  userId: string;
  date: string;
  completedChallenges: string[]; // array of challenge IDs
  pointsEarned: number;
}
