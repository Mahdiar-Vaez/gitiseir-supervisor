import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Default fallback coordinates (Tehran center)
export const DEFAULT_COORDINATES: Coordinates = {
  latitude: 35.7219,
  longitude: 51.3347,
};

/**
 * Safely obtain current device coordinates with permission check and fallback.
 * Ensures the driver is never blocked by disabled GPS or simulator limitations.
 */
export async function getCurrentCoordinates(): Promise<Coordinates> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[GPS] Location permission not granted, using default coordinates');
      return DEFAULT_COORDINATES;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: Number(location.coords.latitude.toFixed(6)),
      longitude: Number(location.coords.longitude.toFixed(6)),
    };
  } catch (error: any) {
    console.warn('[GPS] Error fetching device position, using fallback:', error?.message);
    return DEFAULT_COORDINATES;
  }
}
