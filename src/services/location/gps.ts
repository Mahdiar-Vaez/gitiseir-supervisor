import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Default fallback coordinates (Tehran center) when GPS hardware is off
export const DEFAULT_COORDINATES: Coordinates = {
  latitude: 35.7219,
  longitude: 51.3347,
};

/**
 * Safely obtain current device coordinates with permission check and last-known fallback.
 * Logs with console.log in English to avoid triggering React Native LogBox warning banners.
 */
export async function getCurrentCoordinates(): Promise<Coordinates> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('[GPS] Location permission not granted, using default coordinates');
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
    try {
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown?.coords) {
        console.log('[GPS] Using last known position');
        return {
          latitude: Number(lastKnown.coords.latitude.toFixed(6)),
          longitude: Number(lastKnown.coords.longitude.toFixed(6)),
        };
      }
    } catch {
      // Ignore secondary error
    }
    console.log('[GPS] Could not fetch live device position, using default coordinates:', error?.message);
    return DEFAULT_COORDINATES;
  }
}
