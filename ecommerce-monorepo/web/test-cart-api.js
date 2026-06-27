async function testCartAPI() {
  console.log('🧪 Testing Cart API...\n');
  
  // Test 1: GET cart without userId (should return 400)
  console.log('Test 1: GET /api/cart without userId');
  try {
    const response = await fetch('http://localhost:3005/api/cart');
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    console.log(response.status === 400 ? '✅ Pass' : '❌ Fail');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: GET cart with a test userId
  console.log('Test 2: GET /api/cart with userId');
  try {
    const response = await fetch('http://localhost:3005/api/cart?userId=test-user-123');
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log(response.status === 200 ? '✅ Pass' : '❌ Fail');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testCartAPI().catch(console.error);
