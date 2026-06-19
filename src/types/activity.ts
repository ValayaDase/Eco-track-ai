export interface IActivity {
  _id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  walkingDistance: number;
  cyclingDistance: number;
  bikeDistance: number;
  carDistance: number;
  busDistance: number;
  trainDistance: number;
  electricityUnits: number;
  acHours: number;
  foodType: string;
  plasticUsage: number; // number of single-use items
  shoppingCount: number;
}
