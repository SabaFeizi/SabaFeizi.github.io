// Wait until the preview server answers before running tests.
export default async function globalSetup(config) {
  const url = config.projects[0].use.baseURL;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Preview server not reachable at ${url}`);
}
