// Verification script for Calendar API client
const { getWorkCalendarApi, getDayTripsGridApi } = require('../src/services/api/calendar');

async function testCalendarApi() {
  console.log('--- Testing Work Calendar API Service ---');

  // Test 1: getWorkCalendarApi
  console.log('\n1. Testing getWorkCalendarApi(1405, 7)...');
  const calRes = await getWorkCalendarApi(1405, 7, null, null);
  console.log('Calendar Response Success:', calRes.success);
  console.log('Days Count:', calRes.result?.days?.length);
  if (!calRes.result?.days || calRes.result.days.length === 0) {
    throw new Error('getWorkCalendarApi failed to return days');
  }

  // Test 2: getDayTripsGridApi
  console.log('\n2. Testing getDayTripsGridApi(1405, 7, 15)...');
  const dayRes = await getDayTripsGridApi(1405, 7, 15, null);
  console.log('Day Trips Success:', dayRes.success);
  console.log('Day Trips Count:', dayRes.result?.length);
  if (!Array.isArray(dayRes.result) || dayRes.result.length === 0) {
    throw new Error('getDayTripsGridApi failed to return array');
  }

  const sampleTrip = dayRes.result[0];
  console.log('Sample Trip:', sampleTrip.tripName, sampleTrip.outbound?.start, sampleTrip.licensePlate);

  console.log('\n--- All Work Calendar API Service Tests Passed! ---');
}

testCalendarApi().catch((err) => {
  console.error(err);
  process.exit(1);
});
