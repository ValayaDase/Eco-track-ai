export const EMISSION_FACTORS = {
  transport: {
    walking: 0.0, // kg CO2 per km
    cycling: 0.0, // kg CO2 per km
    bike: 0.113,  // kg CO2 per km
    car: 0.171,   // kg CO2 per km
    bus: 0.096,   // kg CO2 per km
    train: 0.035  // kg CO2 per km
  },
  electricity: {
    perKwh: 0.475,  // kg CO2 per kWh (unit)
    acPerHour: 0.7125 // kg CO2 per hour (assuming 1.5kW AC power usage)
  },
  food: {
    vegan: 0.6,       // kg CO2 per meal
    vegetarian: 0.8,  // kg CO2 per meal
    pescatarian: 1.2, // kg CO2 per meal
    "meat-heavy": 2.5 // kg CO2 per meal
  },
  waste: {
    perPlasticItem: 0.05 // kg CO2 per single use plastic item
  },
  shopping: {
    perItem: 6.0 // kg CO2 per new clothing/electronics/goods purchased
  }
};

export const ENVIRONMENTAL_EQUIVALENTS = {
  // 1 tree absorbs approx 20 kg of CO2 per year
  co2PerTreeYear: 20,
  // 1 smartphone charge is approx 0.0083 kg CO2
  co2PerPhoneCharge: 0.0083,
  // 1 hour of LED bulb is approx 0.004 kg CO2, incandescent is 0.06 kg CO2
  co2PerBulbHour: 0.06
};
