/**
 * Redis Connection Test Script
 * 
 * Tests both Redis implementations:
 * 1. Standard Redis (for caching)
 * 2. Upstash Redis (for rate limiting)
 * 
 * Usage: npx tsx scripts/test-redis.ts
 */

import { createClient } from 'redis';

console.log('🧪 Testing Redis Connections...\n');

// Test 1: Standard Redis (Caching)
async function testStandardRedis() {
  console.log('📦 Test 1: Standard Redis (Caching)');
  console.log('─────────────────────────────────────');
  
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  
  if (!redisUrl) {
    console.log('❌ No REDIS_URL or KV_URL found');
    console.log('   Set one of these environment variables:\n');
    console.log('   Railway Plugin: REDIS_URL (auto-configured)');
    console.log('   Railway KV: KV_URL (auto-configured)');
    console.log('   Manual: redis://localhost:6379\n');
    return false;
  }
  
  console.log(`✅ Found Redis URL: ${redisUrl.substring(0, 20)}...`);
  
  try {
    const client = createClient({ url: redisUrl });
    
    client.on('error', (err) => {
      console.error('❌ Redis Error:', err.message);
    });
    
    console.log('🔌 Connecting to Redis...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Test write
    console.log('📝 Testing write operation...');
    await client.set('test:connection', 'SUCCESS', { EX: 60 });
    console.log('✅ Write successful');
    
    // Test read
    console.log('📖 Testing read operation...');
    const value = await client.get('test:connection');
    console.log(`✅ Read successful: ${value}`);
    
    // Test delete
    console.log('🗑️  Testing delete operation...');
    await client.del('test:connection');
    console.log('✅ Delete successful');
    
    await client.quit();
    console.log('✅ Standard Redis: FULLY FUNCTIONAL\n');
    return true;
  } catch (error: any) {
    console.error('❌ Standard Redis Error:', error.message);
    console.log('');
    return false;
  }
}

// Test 2: Upstash Redis (Rate Limiting)
async function testUpstashRedis() {
  console.log('📦 Test 2: Upstash Redis (Rate Limiting)');
  console.log('─────────────────────────────────────');
  
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!upstashUrl || !upstashToken) {
    console.log('❌ No Upstash Redis credentials found');
    console.log('   Set these environment variables:\n');
    console.log('   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io');
    console.log('   UPSTASH_REDIS_REST_TOKEN=your_token_here\n');
    console.log('   Sign up at: https://console.upstash.com/\n');
    return false;
  }
  
  console.log(`✅ Found Upstash URL: ${upstashUrl.substring(0, 30)}...`);
  console.log(`✅ Found Upstash Token: ${upstashToken.substring(0, 20)}...`);
  
  try {
    // Use Upstash REST API
    console.log('🔌 Testing Upstash REST API...');
    
    // Test SET
    const setResponse = await fetch(`${upstashUrl}/set/test:upstash/SUCCESS`, {
      headers: {
        Authorization: `Bearer ${upstashToken}`,
      },
    });
    
    if (!setResponse.ok) {
      throw new Error(`HTTP ${setResponse.status}: ${await setResponse.text()}`);
    }
    
    console.log('✅ Write successful');
    
    // Test GET
    const getResponse = await fetch(`${upstashUrl}/get/test:upstash`, {
      headers: {
        Authorization: `Bearer ${upstashToken}`,
      },
    });
    
    if (!getResponse.ok) {
      throw new Error(`HTTP ${getResponse.status}: ${await getResponse.text()}`);
    }
    
    const data = await getResponse.json();
    console.log(`✅ Read successful: ${data.result}`);
    
    // Test DEL
    const delResponse = await fetch(`${upstashUrl}/del/test:upstash`, {
      headers: {
        Authorization: `Bearer ${upstashToken}`,
      },
    });
    
    if (!delResponse.ok) {
      throw new Error(`HTTP ${delResponse.status}: ${await delResponse.text()}`);
    }
    
    console.log('✅ Delete successful');
    console.log('✅ Upstash Redis: FULLY FUNCTIONAL\n');
    return true;
  } catch (error: any) {
    console.error('❌ Upstash Redis Error:', error.message);
    console.log('');
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   LIGHTPOINT REDIS CONNECTION TEST    ║');
  console.log('╚═══════════════════════════════════════╝\n');
  
  const standardRedisOk = await testStandardRedis();
  const upstashRedisOk = await testUpstashRedis();
  
  console.log('╔═══════════════════════════════════════╗');
  console.log('║            TEST RESULTS               ║');
  console.log('╚═══════════════════════════════════════╝\n');
  
  console.log(`Standard Redis (Caching):     ${standardRedisOk ? '✅ WORKING' : '❌ NOT CONFIGURED'}`);
  console.log(`Upstash Redis (Rate Limiting): ${upstashRedisOk ? '✅ WORKING' : '❌ NOT CONFIGURED'}\n`);
  
  if (standardRedisOk && upstashRedisOk) {
    console.log('🎉 BOTH REDIS INSTANCES WORKING!');
    console.log('   - Caching: Enabled (50-60% faster on cache hits)');
    console.log('   - Rate Limiting: Enabled (API protection active)\n');
  } else if (standardRedisOk) {
    console.log('⚠️  Standard Redis working, but Upstash not configured');
    console.log('   - Caching: Enabled ✅');
    console.log('   - Rate Limiting: Disabled ⚠️\n');
  } else if (upstashRedisOk) {
    console.log('⚠️  Upstash Redis working, but Standard Redis not configured');
    console.log('   - Caching: Disabled ⚠️');
    console.log('   - Rate Limiting: Enabled ✅\n');
  } else {
    console.log('❌ NO REDIS CONFIGURED');
    console.log('   - Caching: Disabled');
    console.log('   - Rate Limiting: Disabled');
    console.log('   - Performance: Not optimized\n');
  }
  
  console.log('📚 Next Steps:');
  console.log('──────────────');
  if (!standardRedisOk) {
    console.log('1. For caching, add one of:');
    console.log('   Railway: Add Redis database plugin');
    console.log('   Manual: Set REDIS_URL environment variable\n');
  }
  if (!upstashRedisOk) {
    console.log('2. For rate limiting:');
    console.log('   Sign up: https://console.upstash.com/');
    console.log('   Set: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN\n');
  }
  
  process.exit(standardRedisOk || upstashRedisOk ? 0 : 1);
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

