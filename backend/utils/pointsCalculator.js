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
 * Calculate points based on waste type and quantity
 * @param {string} wasteType - Type of waste
 * @param {number} quantity - Quantity in kilograms
 * @returns {number} Points earned
 */
const calculatePoints = (wasteType, quantity) => {
    const multiplier = POINTS_MULTIPLIERS[wasteType] || 1;
    const points = Math.floor(BASE_POINTS + (quantity * 20 * multiplier));
    return Math.min(points, MAX_POINTS); // Cap at max points
};

module.exports = {
    calculatePoints,
    POINTS_MULTIPLIERS,
    BASE_POINTS,
    MAX_POINTS
};