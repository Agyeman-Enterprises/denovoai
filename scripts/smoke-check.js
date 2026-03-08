(async () => {
  try {
    const base = 'http://localhost:3000';
    const apiRes = await fetch(`${base}/api/runs`);
    if (!apiRes.ok) {
      console.error('API /api/runs returned', apiRes.status);
      process.exit(2);
    }
    const api = await apiRes.json();
    if (!api.runs || api.runs.length === 0) {
      console.log('NO_RUNS');
      process.exit(0);
    }
    const id = api.runs[0].id;
    console.log('FOUND_RUN:' + id);
    console.log('---API-SAMPLE---');
    console.log(JSON.stringify(api.runs[0], null, 2));

    const buildRes = await fetch(`${base}/build/${id}`);
    if (!buildRes.ok) {
      console.error('Build page returned', buildRes.status);
      process.exit(3);
    }
    const html = await buildRes.text();
    if (html.includes('Your App Is Ready')) {
      console.log('BUILD_HERO_FOUND');
    } else {
      console.log('BUILD_HERO_MISSING');
      console.log(html.slice(0, 600));
    }
  } catch (e) {
    console.error('ERROR', e.message || e);
    process.exit(1);
  }
})();
