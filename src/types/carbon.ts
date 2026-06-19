export interface ICarbonRecord {
  _id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  transportEmission: number;
  electricityEmission: number;
  foodEmission: number;
  wasteEmission: number;
  shoppingEmission: number;
  totalEmission: number;
}
