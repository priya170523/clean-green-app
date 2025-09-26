const POINTS_MULTIPLIERS = {
    plastic: 2.0,   // High value for recycling
    paper: 1.5,     // Medium-high value
    metal: 2.5,     // Highest value
    glass: 2.0,     // High value
    organic: 1.0,   // Base value
    mixed: 1.0      // Base value
};

const BASE_POINTS = 10; // Base points for any waste collection
const MAX_POINTS = 100; // Maximum points for a single transaction

/**
 * Calculate points or earnings based on waste type, quantity, and mode
 * @param {string} wasteType - Type of waste
 * @param {number} quantity - Quantity in kilograms
 * @param {string} mode - 'user' for points, 'delivery' for earnings
 * @returns {object} {points, earnings}
 */
const calculatePoints = (wasteType, quantity, mode = 'user') => {
  if (mode === 'delivery') {
    // Delivery earnings: 10-40 rupees
    const baseEarnings = 10;
    const earningsPerKg = 15;
    const earnings = Math.min(40, Math.floor(baseEarnings + (earningsPerKg * quantity)));
    return { points: 0, earnings };
  }

  // User points: 10-50
  const basePoints = 10;
  let pointsPerKg = 20;

  // Map app waste types to multipliers
  switch (wasteType) {
    case 'bottles':
      pointsPerKg = 25;
      break;
    case 'mixed':
      pointsPerKg = 20;
      break;
    case 'other':
      pointsPerKg = 15;
      break;
    default:
      pointsPerKg = 20;
  }

  const points = Math.min(50, Math.floor(basePoints + (pointsPerKg * quantity)));
  return { points, earnings: 0 };
};

module.exports = {
    calculatePoints,
    POINTS_MULTIPLIERS,
    BASE_POINTS,
    MAX_POINTS
};