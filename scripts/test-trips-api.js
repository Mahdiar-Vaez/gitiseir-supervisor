// Integration test for Driver Trip endpoints
const BASE_URL = 'https://backend.vaezprojects.ir';

async function testTrips() {
  console.log('--- Testing Driver Trips API Endpoints ---');

  // Test 1: GET /api/driversMobile/Trip/active
  console.log('\n1. Testing GET /api/driversMobile/Trip/active ...');
  try {
    const res = await fetch(`${BASE_URL}/api/driversMobile/Trip/active`, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`HTTP Status: ${res.status}`);
    const data = await res.json().catch(() => null);
    console.log('Response body:', data);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }

  // Test 2: GET /api/driversMobile/Trip/today
  console.log('\n2. Testing GET /api/driversMobile/Trip/today ...');
  try {
    const res = await fetch(`${BASE_URL}/api/driversMobile/Trip/today`, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`HTTP Status: ${res.status}`);
    const data = await res.json().catch(() => null);
    console.log('Response body:', data);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }

  // Test 3: GET /api/driversMobile/Trip/31478/summary
  console.log('\n3. Testing GET /api/driversMobile/Trip/31478/summary ...');
  try {
    const res = await fetch(`${BASE_URL}/api/driversMobile/Trip/31478/summary`, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`HTTP Status: ${res.status}`);
    const data = await res.json().catch(() => null);
    console.log('Response body:', data);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }

  console.log('\n--- Trips API Tests Finished ---');
}

testTrips();
