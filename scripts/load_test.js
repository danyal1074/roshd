/**
 * Realistic Load & Concurrency Test for 400 Students
 * Staggers arrival over 2 seconds to simulate real-world classroom/exam check-in
 */

const { db } = require('../backend/db');
const BASE_URL = 'http://localhost:5000';

const allStudentIds = db.prepare("SELECT national_id FROM users WHERE role = 'student' LIMIT 400")
  .all()
  .map(u => u.national_id);

async function performStudentSession(studentIndex, nationalId) {
  const start = Date.now();
  const timings = [];

  async function timedFetch(url, options) {
    const t0 = Date.now();
    const res = await fetch(url, options);
    const duration = Date.now() - t0;
    timings.push(duration);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP ${res.status}: ${err.slice(0, 60)}`);
    }
    return res;
  }

  // 1. Authenticate
  const loginRes = await timedFetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: nationalId, password: '123456', role: 'student' })
  });
  const data = await loginRes.json();
  const token = data.token;
  const userId = data.user.id;

  const authHeaders = { 'Authorization': `Bearer ${token}` };

  // 2. Fetch homeworks
  await timedFetch(`${BASE_URL}/api/homeworks`, { headers: authHeaders });

  // 3. Fetch exams
  await timedFetch(`${BASE_URL}/api/exams`, { headers: authHeaders });

  // 4. Fetch study stats
  await timedFetch(`${BASE_URL}/api/study/stats/${userId}`, { headers: authHeaders });

  // 5. Fetch points
  await timedFetch(`${BASE_URL}/api/points/${userId}`, { headers: authHeaders });

  return {
    success: true,
    totalTime: Date.now() - start,
    timings
  };
}

async function runStaggeredStage(concurrency, staggerMs = 5) {
  console.log(`\n>>> Testing Concurrency Level: ${concurrency} students (staggered by ${staggerMs}ms)...`);
  
  const tasks = [];
  const tStart = Date.now();

  for (let i = 0; i < concurrency; i++) {
    const nid = allStudentIds[i % allStudentIds.length] || '0012345678';
    const delay = i * staggerMs;
    tasks.push(
      new Promise(resolve => setTimeout(resolve, delay)).then(() =>
        performStudentSession(i, nid).catch(err => ({
          success: false,
          error: err.message,
          timings: []
        }))
      )
    );
  }

  const results = await Promise.all(tasks);
  const totalDuration = (Date.now() - tStart) / 1000;

  const successfulSessions = results.filter(r => r.success);
  const failedSessions = results.filter(r => !r.success);

  const allTimings = results.flatMap(r => r.timings).sort((a, b) => a - b);
  const totalRequests = allTimings.length;

  const avgLatency = allTimings.reduce((sum, t) => sum + t, 0) / (allTimings.length || 1);
  const minLatency = allTimings[0] || 0;
  const maxLatency = allTimings[allTimings.length - 1] || 0;
  const p95Latency = allTimings[Math.floor(allTimings.length * 0.95)] || 0;
  const p99Latency = allTimings[Math.floor(allTimings.length * 0.99)] || 0;
  const rps = (totalRequests / (totalDuration || 1)).toFixed(1);

  console.log(`  Results for ${concurrency} students:`);
  console.log(`  - Completed Sessions: ${successfulSessions.length} / ${concurrency} (${((successfulSessions.length / concurrency) * 100).toFixed(1)}%)`);
  console.log(`  - Total Requests: ${totalRequests}`);
  console.log(`  - Total Time: ${totalDuration.toFixed(2)}s`);
  console.log(`  - Throughput: ${rps} req/sec`);
  console.log(`  - Latency: Min=${minLatency}ms | Avg=${avgLatency.toFixed(1)}ms | P95=${p95Latency}ms | P99=${p99Latency}ms | Max=${maxLatency}ms`);

  if (failedSessions.length > 0) {
    console.warn(`  - Failures: ${failedSessions.length} sessions had errors (e.g. ${failedSessions[0].error})`);
  }

  return {
    concurrency,
    successRate: (successfulSessions.length / concurrency) * 100,
    totalRequests,
    totalDuration,
    rps,
    avgLatency: avgLatency.toFixed(1),
    p95Latency,
    p99Latency,
    failures: failedSessions.length
  };
}

async function runRealisticLoadTest() {
  console.log('================================================================');
  console.log('    REALISTIC ROSHD PLATFORM LOAD TEST (400 USERS WITH STAGGER)  ');
  console.log('================================================================');

  const stages = [50, 100, 200, 400];
  const summary = [];

  for (const c of stages) {
    const res = await runStaggeredStage(c, 8); // 8ms stagger
    summary.push(res);
  }

  console.log('\n================================================================');
  console.log('                 REALISTIC LOAD TEST SUMMARY TABLE              ');
  console.log('================================================================');
  console.log('Users\tSuccess\tTotalReq\tDuration\tReq/Sec\tAvg(ms)\tP95(ms)');
  summary.forEach(s => {
    console.log(`${s.concurrency}\t${s.successRate}%\t${s.totalRequests}\t\t${s.totalDuration.toFixed(1)}s\t\t${s.rps}\t${s.avgLatency}\t${s.p95Latency}`);
  });
  console.log('================================================================\n');
}

runRealisticLoadTest();
