/**
 * Script to fetch your Gamma themes and their IDs
 * Run with: npx ts-node scripts/get-gamma-themes.ts
 */

const GAMMA_API_KEY = process.env.GAMMA_API_KEY || 'sk-gamma-Z5mH9MelQJNvkCStfpQ206TN1ZMwJFlF2Bzvs0ouWT4';

async function getThemes() {
  console.log('Fetching Gamma themes...\n');
  
  const response = await fetch('https://public-api.gamma.app/v1.0/themes', {
    headers: {
      'X-API-KEY': GAMMA_API_KEY,
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('Error:', response.status, await response.text());
    return;
  }

  const themes = await response.json();
  
  console.log('Your Gamma Themes:');
  console.log('==================\n');
  
  if (Array.isArray(themes)) {
    themes.forEach((theme: any) => {
      console.log(`Name: ${theme.name}`);
      console.log(`ID:   ${theme.id}`);
      console.log(`---`);
    });
  } else {
    console.log(JSON.stringify(themes, null, 2));
  }
}

getThemes().catch(console.error);

