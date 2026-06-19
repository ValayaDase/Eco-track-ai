export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  profileCompleted: boolean;
  createdAt: Date;
}

export interface IProfile {
  _id: string;
  userId: string;
  age: number;
  city: string;
  country: string;
  occupation: string;
  familySize: number;
  dietType: string;
  transportMode: string;
  electricityUsage: string;
}
