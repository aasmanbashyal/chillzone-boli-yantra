import { test, expect } from '@playwright/test';

test('Phonon produces non-silent WAV audio with real LiteRT WASM inference', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { createTtsEngine } = await import('/src/tts-engine.js');
    const engine = createTtsEngine();
    try {
      const blob = await engine.synthesize('Hello from ChillZone.');
      const buffer = await blob.arrayBuffer();
      const view = new DataView(buffer);
      let peak = 0;
      for (let offset = 44; offset < buffer.byteLength; offset += 2) peak = Math.max(peak, Math.abs(view.getInt16(offset, true)));
      return { size: blob.size, rate: view.getUint32(24, true), peak, type: blob.type };
    } finally { engine.dispose(); }
  });
  console.log('Real LiteRT synthesis:', result);
  expect(result.type).toBe('audio/wav');
  expect(result.rate).toBe(24000);
  expect(result.size).toBeGreaterThan(24000);
  expect(result.peak).toBeGreaterThan(100);
});
