import axios from 'axios';

// OpenStreetMap-based routing using OpenRouteService (free tier available)
const OPENROUTE_API_KEY = 'YOUR_OPENROUTE_API_KEY'; // Optional - can work without it
const OPENROUTE_BASE_URL = 'https://api.openrouteservice.org/v2/directions';

export const getDirections = async (origin, destination) => {
  try {
    // First try OpenRouteService (free tier available)
    if (OPENROUTE_API_KEY && OPENROUTE_API_KEY !== 'YOUR_OPENROUTE_API_KEY') {
      const response = await axios.get(OPENROUTE_BASE_URL, {
        params: {
          api_key: OPENROUTE_API_KEY,
          start: `${origin.longitude},${origin.latitude}`,
          end: `${destination.longitude},${destination.latitude}`,
          profile: 'driving-car',
          format: 'json',
          options: '{"avoid_tolls":true,"avoid_highways":false}',
        },
      });

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        const coordinates = feature.geometry.coordinates;
        
        // Convert coordinates to waypoints
        const waypoints = coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        
        const properties = feature.properties;
        const summary = properties.summary;
        
        return {
          success: true,
          waypoints: waypoints,
          distance: `${(summary.distance / 1000).toFixed(1)} km`,
          duration: `${Math.round(summary.duration / 60)} mins`,
          startLocation: origin,
          endLocation: destination,
        };
      }
    }
    
    // Fallback to OSRM (Open Source Routing Machine) - completely free
    return await getOSRMDirections(origin, destination);
    
  } catch (error) {
    console.error('OpenRouteService API Error:', error);
    // Fallback to OSRM
    return await getOSRMDirections(origin, destination);
  }
};

// OSRM (Open Source Routing Machine) - completely free, no API key required
const getOSRMDirections = async (origin, destination) => {
  try {
    // OSRM expects coordinates in the URL path, not as query parameters
    const startCoords = `${origin.longitude},${origin.latitude}`;
    const endCoords = `${destination.longitude},${destination.latitude}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${startCoords};${endCoords}`;
    
    const response = await axios.get(url, {
      params: {
        overview: 'full',
        geometries: 'geojson',
        steps: false,
      },
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
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        addressdetails: 1,
      },
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
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        addressdetails: 1,
        limit: 5,
        lat: latitude,
        lon: longitude,
        radius: 10000, // 10km radius
      },
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
