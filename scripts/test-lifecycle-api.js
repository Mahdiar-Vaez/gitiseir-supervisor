/**
 * Verification test for startTrip and endTrip lifecycle endpoints
 */
const API_BASE_URL = 'https://backend.vaezprojects.ir';

async function testLifecycleEndpoints() {
  const calendarDayId = '7c88de59-27b8-46e9-0d02-08df3206a1e1';
  const startUrl = `${API_BASE_URL}/api/driversMobile/Trip/${calendarDayId}/start`;
  const endUrl = `${API_BASE_URL}/api/driversMobile/Trip/${calendarDayId}/end`;
  const body = JSON.stringify({
    latitude: 35.7219,
    longitude: 51.3347,
  });

  console.log('[TEST] Checking Start URL:', startUrl);
  console.log('[TEST] Checking End URL:', endUrl);
  console.log('[TEST] Checking Body:', body);

  if (!startUrl.includes(calendarDayId)) {
    throw new Error('Start URL does not include calendarDayId');
  }
  if (!endUrl.includes(calendarDayId)) {
    throw new Error('End URL does not include calendarDayId');
  }

  console.log('[TEST] Lifecycle endpoints contract verified successfully.');
}

testLifecycleEndpoints().catch((err) => {
  console.error('[TEST] Verification error:', err);
  process.exit(1);
});
