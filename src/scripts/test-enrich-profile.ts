const userId = 'ACoAAC8gSMsBTEUbLWLMY3vLN4t55L6Nj11_h3o';

async function testEnrichProfile() {
  const response = await fetch('http://localhost:3000/api/linkedin/enrich-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const data = await response.json();
  console.log('Enrich Profile Result:', JSON.stringify(data, null, 2));
}

testEnrichProfile(); 