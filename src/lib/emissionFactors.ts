// src/constants/emissionFactors.ts

export const EMISSION_FACTORS = {
  transport: {
    walking: 0,
    bicycle: 0,
    bike: 0.103,
    car: 0.192,
    bus: 0.089,
    train: 0.041,
  },

  electricity: {
    indiaGrid: 0.82,
  },

  food: {
    vegan: 30,
    vegetarian: 50,
    pescatarian: 70,
    "meat-heavy": 120,
  },

  waste: {
    low: 5,
    medium: 15,
    high: 30,
  },
};