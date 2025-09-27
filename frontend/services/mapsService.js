import axios from 'axios';

// Rate limiting and retry configuration
const RETRY_DELAYS = [1000, 2000, 4000, 8000]; // Exponential backoff delays in ms
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const rateLimitedRequest = async (requestFn, retryCount = 0) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await wait(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }

  try {
    lastRequestTime = Date.now();
    return await requestFn();
  } catch (error) {
    if (error.response?.status === 429 && retryCount < RETRY_DELAYS.length) {
      const delay = RETRY_DELAYS[retryCount];
      await wait(delay);
      return rateLimitedRequest(requestFn, retryCount + 1);
    }
    throw error;
  }
};

export const getDirections = async (origin, destination, options = {}) => {
  console.log('Getting directions:', { origin, destination });

  // Validate coordinates
  if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) {
    console.error('Invalid coordinates provided:', { origin, destination });
    return {
      success: false,
      error: 'Invalid coordinates provided',
      details: { origin, destination }
    };
  }

  // Use OSRM (Open Source Routing Machine) - completely free, no API key required
  return await getOSRMDirections(origin, destination, options);
};

// OSRM (Open Source Routing Machine) - completely free, no API key required
const getOSRMDirections = async (origin, destination) => {
  try {
    // OSRM expects coordinates in the URL path, not as query parameters
    const startCoords = `${origin.longitude},${origin.latitude}`;
    const endCoords = `${destination.longitude},${destination.latitude}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${startCoords};${endCoords}`;
    
    const response = await rateLimitedRequest(async () => {
      return await axios.get(url, {
        params: {
          overview: 'full',
          geometries: 'geojson',
          steps: false,
        },
        timeout: 10000 // 10 second timeout
      });
    });

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const coordinates = route.geometry.coordinates;
      
      // Convert coordinates to waypoints
      const waypoints = coordinates.map(coord => ({
        latitude: coord[1],
        longitude: coord[0],
      }));
      
      return {
        success: true,
        waypoints: waypoints,
        distance: `${(route.distance / 1000).toFixed(1)} km`,
        duration: `${Math.round(route.duration / 60)} mins`,
        startLocation: origin,
        endLocation: destination,
      };
    }
    
    return {
      success: false,
      error: 'No routes found',
    };
  } catch (error) {
    console.error('OSRM API Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};


// Fallback function using simple geometric calculation
export const getFallbackDirections = (origin, destination) => {
  const waypoints = [];
  const latDiff = destination.latitude - origin.latitude;
  const lngDiff = destination.longitude - origin.longitude;
  
  // Calculate distance for more accurate estimation
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Rough km conversion
  const estimatedDuration = Math.round(distance * 2); // Rough 2 minutes per km
  
  // Create waypoints that simulate road-based routing
  const steps = Math.max(8, Math.min(20, Math.round(distance * 4))); // More waypoints for longer distances
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const lat = origin.latitude + (latDiff * progress);
    const lng = origin.longitude + (lngDiff * progress);
    
    // Add some road-like curves and turns
    let adjustedLat = lat;
    let adjustedLng = lng;
    
    if (i > 0 && i < steps) {
      // Add road-like curves based on distance
      const curveFactor = Math.sin(progress * Math.PI) * (0.0002 + distance * 0.0001);
      adjustedLat += curveFactor;
      adjustedLng += curveFactor * 0.5;
      
      // Add some random road-like variations
      const variation = (Math.random() - 0.5) * 0.0001;
      adjustedLat += variation;
      adjustedLng += variation * 0.3;
    }
    
    waypoints.push({
      latitude: adjustedLat,
      longitude: adjustedLng,
    });
  }
  
  return {
    success: true,
    waypoints: waypoints,
    distance: `${distance.toFixed(1)} km`,
    duration: `${estimatedDuration} mins`,
    startLocation: origin,
    endLocation: destination,
  };
};

// Additional OpenStreetMap-based geocoding service
export const reverseGeocode = async (latitude, longitude) => {
  if (!latitude || !longitude) {
    return {
      success: false,
      error: 'Invalid coordinates provided'
    };
  }

  try {
    const response = await rateLimitedRequest(async () => {
      return await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'CleanGreenApp/1.0'
        },
        timeout: 5000
      });
    });

    if (response.data && response.data.display_name) {
      return {
        success: true,
        address: response.data.display_name,
        details: response.data.address,
      };
    }
    
    return {
      success: false,
      error: 'No address found',
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Search for places using OpenStreetMap
export const searchPlaces = async (query, latitude, longitude) => {
  if (!query) {
    return {
      success: false,
      error: 'Search query is required'
    };
  }

  try {
    const response = await rateLimitedRequest(async () => {
      return await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
          limit: 5,
          lat: latitude,
          lon: longitude,
          radius: 10000, // 10km radius
        },
        headers: {
          'User-Agent': 'CleanGreenApp/1.0'
        },
        timeout: 5000
      });
    });

    if (response.data && response.data.length > 0) {
      const places = response.data.map(place => ({
        name: place.display_name,
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        type: place.type,
        importance: place.importance,
      }));
      
      return {
        success: true,
        places: places,
      };
    }
    
    return {
      success: false,
      error: 'No places found',
    };
  } catch (error) {
    console.error('Place search error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
