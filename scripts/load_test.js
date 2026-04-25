/**
 * REGULON LOAD TEST SCRIPT
 * Simulates multiple concurrent CAs hitting the dashboard
 */

const API_URL = 'http://localhost:3001/api/v1';
const CONCURRENT_USERS = 20; // Simulated simultaneous hits

async function simulateCADashboardHit(userId) {
  const start = Date.now();
  console.log(`[User ${userId}] Starting request...`);
  
  try {
    const response = await fetch(`${API_URL}/ca/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token-here' // In real test, use unique tokens
      }
    });
    
    const duration = Date.now() - start;
    console.log(`[User ${userId}] Status: ${response.status} | Duration: ${duration}ms`);
  } catch (error) {
    console.error(`[User ${userId}] FAILED:`, error.message);
  }
}

async function runLoadTest() {
  console.log(`🚀 Starting Load Test for ${CONCURRENT_USERS} concurrent requests...`);
  const startTime = Date.now();
  
  const requests = [];
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    requests.push(simulateCADashboardHit(i));
  }
  
  await Promise.all(requests);
  
  const totalDuration = Date.now() - startTime;
  console.log(`\n✅ Load test finished in ${totalDuration}ms`);
  console.log(`Avg time per user: ${totalDuration / CONCURRENT_USERS}ms`);
}

runLoadTest();
