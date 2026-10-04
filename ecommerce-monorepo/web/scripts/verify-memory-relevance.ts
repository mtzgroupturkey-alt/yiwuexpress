import { searchSimilarMemories, recordDecisionMemory } from '../lib/autopilot/learning/memory';

async function run() {
  await recordDecisionMemory({
    contextText: 'Security incident with credit card testing and brute force attempts on payments gateway',
    decision: { key: 'block_ip_range', department: 'security' }
  });
  await recordDecisionMemory({
    contextText: 'Border customs inspection delay stalling shipping containers in transit',
    decision: { key: 'expedite_customs_broker', department: 'logistics' }
  });

  const q1 = await searchSimilarMemories({ queryText: 'security breach payment', limit: 2, minSimilarity: 0.1 });
  const q2 = await searchSimilarMemories({ queryText: 'customs delay logistics', limit: 2, minSimilarity: 0.1 });
  const q3 = await searchSimilarMemories({ queryText: 'xyzzy nonexist random gibberish', limit: 2, minSimilarity: 0.1 });

  console.log('--- Query 1: security breach payment ---');
  console.log(q1.map(m => ({ score: m.similarity, text: m.contextText.slice(0, 50) })));

  console.log('--- Query 2: customs delay logistics ---');
  console.log(q2.map(m => ({ score: m.similarity, text: m.contextText.slice(0, 50) })));

  console.log('--- Query 3: nonexistent gibberish ---');
  console.log(q3.map(m => ({ score: m.similarity, text: m.contextText.slice(0, 50) })));
  process.exit(0);
}

run();
