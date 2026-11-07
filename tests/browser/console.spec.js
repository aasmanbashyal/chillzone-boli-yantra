import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.audioClips = [];
    window.audioMode = 'success';
    window.ttsMode = 'success';
    window.ttsWorkers = [];
    window.Audio = class {
      constructor(url) { this.url = url; window.audioClips.push(this); }
      play() {
        if (window.audioMode === 'blocked') { const error = new Error('blocked'); error.name = 'NotAllowedError'; return Promise.reject(error); }
        if (window.audioMode === 'pending') return new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject; });
        return Promise.resolve();
      }
      pause() { this.paused = true; }
      removeAttribute() { this.released = true; }
      load() {}
    };
    window.Worker = class {
      constructor() { this.jobs = []; window.ttsWorkers.push(this); }
      terminate() { this.terminated = true; }
      postMessage(data) {
        this.job = data;
        this.jobs.push(data);
        queueMicrotask(() => {
          this.onmessage({ data: { type: 'progress', id: data.id, phase: 'downloading', percent: 40 } });
          if (window.ttsMode === 'pending') return;
          if (window.ttsMode === 'failure') { this.onmessage({ data: { type: 'error', id: data.id, error: 'Model download failed. Try again.' } }); return; }
          this.onmessage({ data: { type: 'voices', id: data.id, voices: [{ voiceId: 'freya', displayName: 'Freya' }, { voiceId: 'claire', displayName: 'Claire' }] } });
          this.onmessage({ data: { type: 'result', id: data.id, samples: new Float32Array([0, 0.1, 0]), sampleRateHz: 24000 } });
        });
      }
    };
  });
  await page.goto('/');
});

test('only existing clips are offered, default is playable, and no media autostarts', async ({ page }) => {
  await expect(page.getByRole('button', { name: /Prashant/ })).toHaveAttribute('aria-pressed', 'true');
  for (const name of ['Aasman', 'Kamal', 'Ujjwal']) await expect(page.getByRole('button', { name: new RegExp(name) })).toBeDisabled();
  expect(await page.evaluate(() => window.audioClips.length + window.ttsWorkers.length)).toBe(0);
  await page.getByRole('button', { name: 'Play character clip' }).click();
  await expect(page.getByRole('status')).toContainText('Audio playing');
  expect(await page.evaluate(() => window.audioClips[0].url)).toBe('/audio/Prashant.wav');
  await page.getByRole('button', { name: 'Stop output' }).click();
  await expect(page.getByRole('status')).toContainText('Output idle');
  expect(await page.evaluate(() => window.audioClips[0].released)).toBe(true);
});

test('blocked playback shows an error and can be retried without overlapping clips', async ({ page }) => {
  await page.evaluate(() => { window.audioMode = 'blocked'; });
  await page.getByRole('button', { name: 'Play character clip' }).click();
  await expect(page.getByRole('alert')).toContainText('blocked by your browser');
  await page.evaluate(() => { window.audioMode = 'success'; });
  await page.getByRole('button', { name: 'Play character clip' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Audio playing');
  expect(await page.evaluate(() => window.audioClips[0].released)).toBe(true);
});

test('stopping a pending clip ignores late playback completion', async ({ page }) => {
  await page.evaluate(() => { window.audioMode = 'pending'; });
  await page.getByRole('button', { name: 'Play character clip' }).click();
  await page.getByRole('button', { name: 'Stop output' }).click();
  await page.evaluate(() => window.audioClips[0].resolve());
  await expect(page.getByRole('status')).toContainText('Output idle');
  await expect(page.getByText('0 events this session')).toBeVisible();
});

test('typed text is sent only to the local worker and returned audio is played', async ({ page }) => {
  await page.getByLabel(/Speech script/).fill('The signal is ready.');
  await page.getByRole('button', { name: 'Speak text' }).click();
  await expect(page.getByRole('status')).toContainText('Audio playing');
  expect(await page.evaluate(() => window.ttsWorkers[0].job.text)).toBe('The signal is ready.');
  expect(await page.evaluate(() => window.audioClips[0].url)).toMatch(/^blob:/);
  await expect(page.getByLabel(/Synthesis voice/).locator('option')).toHaveCount(2);
  await expect(page.getByText('1 events this session')).toBeVisible();
});

test('blocked generated speech can be replayed without another inference', async ({ page }) => {
  await page.evaluate(() => { window.audioMode = 'blocked'; });
  await page.getByRole('button', { name: 'Speak text' }).click();
  await expect(page.getByRole('alert')).toContainText('Speak text or Play character clip');
  await page.evaluate(() => { window.audioMode = 'success'; });
  await page.getByRole('button', { name: 'Speak text' }).click();
  await expect(page.getByRole('status')).toContainText('Audio playing');
  expect(await page.evaluate(() => window.ttsWorkers.length)).toBe(1);
  expect(await page.evaluate(() => window.ttsWorkers[0].jobs.length)).toBe(1);
  expect(await page.evaluate(() => window.audioClips[1].url)).toMatch(/^blob:/);
});

test('speech download can be cancelled and failures remain retryable', async ({ page }) => {
  await page.evaluate(() => { window.ttsMode = 'pending'; });
  await page.getByRole('button', { name: 'Speak text' }).click();
  await expect(page.getByRole('status')).toContainText('Downloading voice model 40%');
  await page.getByRole('button', { name: 'Stop output' }).click();
  expect(await page.evaluate(() => window.ttsWorkers[0].terminated)).toBe(true);
  await page.evaluate(() => { window.ttsMode = 'failure'; });
  await page.getByRole('button', { name: 'Speak text' }).click();
  await expect(page.getByRole('alert')).toContainText('Model download failed');
  await page.evaluate(() => { window.ttsMode = 'success'; });
  await page.getByRole('button', { name: 'Speak text' }).click();
  await expect(page.getByRole('status')).toContainText('Audio playing');
});

test('search, keyboard playback, and output controls work', async ({ page }) => {
  await page.getByLabel('Find a character').fill('missing');
  await expect(page.getByText('No characters match your search.')).toBeVisible();
  await page.getByLabel('Find a character').fill('Prashant');
  await page.getByRole('button', { name: /Prashant/ }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Play character clip' }).focus();
  await page.keyboard.press('Enter');
  await page.getByLabel('Playback speed').selectOption('1.5');
  await page.getByLabel(/Output level/).fill('0.4');
  expect(await page.evaluate(() => window.audioClips[0].playbackRate)).toBe(1.5);
  expect(await page.evaluate(() => window.audioClips[0].volume)).toBe(0.4);
});

for (const width of [320, 390, 768, 1440]) {
  test('console remains usable without horizontal overflow at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: 'Speak text' })).toBeVisible();
    await expect(page.getByLabel(/Speech script/)).toBeVisible();
  });
}
