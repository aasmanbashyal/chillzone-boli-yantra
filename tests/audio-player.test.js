import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createAudioPlayer } from '../src/audio-player.js';
import { characters, defaultCharacter } from '../src/characters.js';

function deferred() {
  let resolve, reject;
  const promise = new Promise((resolvePromise, rejectPromise) => { resolve = resolvePromise; reject = rejectPromise; });
  return { promise, resolve, reject };
}

function fixture() {
  const clips = [], states = [];
  const player = createAudioPlayer({
    onChange: state => states.push(state),
    createAudio(url) {
      const pending = deferred();
      const clip = { url, pending, paused: false, released: false, currentTime: 0, duration: 12,
        play: () => pending.promise,
        pause() { this.paused = true; },
        removeAttribute(name) { assert.equal(name, 'src'); this.released = true; },
        load() {},
      };
      clips.push(clip);
      return clip;
    },
  });
  return { player, clips, states, current: () => states.at(-1) };
}

test('every offered clip and character image exists, and default voice is playable', () => {
  assert.ok(defaultCharacter.audio);
  assert.equal(new Set(characters.map(character => character.id)).size, characters.length);
  for (const character of characters) {
    assert.ok(existsSync(new URL(`../public${character.image}`, import.meta.url)), character.image);
    if (character.audio) assert.ok(existsSync(new URL(`../public${character.audio}`, import.meta.url)), character.audio);
  }
});

test('loads only on explicit play and tracks playback, progress, and completion', async () => {
  const { player, clips, current } = fixture();
  assert.equal(clips.length, 0);
  const playing = player.play('/clip.wav');
  assert.equal(current().status, 'loading');
  const clip = clips[0];
  clip.onloadedmetadata();
  assert.equal(current().duration, 12);
  clip.pending.resolve();
  await playing;
  assert.equal(current().status, 'playing');
  clip.currentTime = 4;
  clip.ontimeupdate();
  assert.equal(current().currentTime, 4);
  clip.onended();
  assert.equal(current().status, 'ended');
  assert.equal(clip.released, true);
});

test('missing clip produces a visible error without requesting an invented URL', async () => {
  const { player, clips, current } = fixture();
  await player.play(null);
  assert.equal(clips.length, 0);
  assert.equal(current().status, 'error');
  assert.match(current().error, /does not have a clip/);
});

test('stop releases a pending clip and ignores its late successful play promise', async () => {
  const { player, clips, current } = fixture();
  const playing = player.play('/clip.wav');
  player.stop();
  assert.equal(clips[0].paused, true);
  assert.equal(clips[0].released, true);
  assert.equal(clips[0].onended, null);
  clips[0].pending.resolve();
  await playing;
  assert.equal(current().status, 'idle');
});

test('switching clips stops the old audio and ignores late rejection and events', async () => {
  const { player, clips, current } = fixture();
  const first = player.play('/first.wav');
  const oldError = clips[0].onerror;
  const second = player.play('/second.wav');
  assert.equal(clips[0].paused, true);
  clips[1].pending.resolve();
  await second;
  clips[0].pending.reject(new Error('stale failure'));
  await first;
  oldError();
  assert.equal(current().status, 'playing');
  assert.equal(current().error, '');
});

test('blocked playback shows a recoverable error and retry succeeds', async () => {
  const { player, clips, current } = fixture();
  const blocked = player.play('/clip.wav');
  const error = new Error('blocked');
  error.name = 'NotAllowedError';
  clips[0].pending.reject(error);
  await blocked;
  assert.match(current().error, /blocked by your browser/);
  assert.match(current().error, /Speak text or Play character clip/);
  assert.equal(clips[0].released, true);
  const retry = player.play('/clip.wav');
  clips[1].pending.resolve();
  await retry;
  assert.equal(current().status, 'playing');
  assert.equal(current().error, '');
});

test('media loading failure cannot be overwritten by a later play resolution', async () => {
  const { player, clips, current } = fixture();
  const playing = player.play('/broken.wav');
  clips[0].onerror();
  clips[0].pending.resolve();
  await playing;
  assert.equal(current().status, 'error');
  assert.match(current().error, /could not be loaded/);
});

test('volume and speed apply to the active clip and persist across clips', async () => {
  const { player, clips, current } = fixture();
  player.setVolume(0.4);
  player.setSpeed(1.25);
  const playing = player.play('/clip.wav');
  assert.equal(clips[0].volume, 0.4);
  assert.equal(clips[0].playbackRate, 1.25);
  player.setVolume(2);
  player.setSpeed(1.5);
  assert.equal(clips[0].volume, 1);
  assert.equal(clips[0].playbackRate, 1.5);
  player.setVolume(NaN);
  player.setSpeed(9);
  assert.equal(current().volume, 1);
  assert.equal(current().speed, 1.5);
  clips[0].pending.resolve();
  await playing;
});

test('unmount cleanup releases media without notifying an unmounted component', async () => {
  const { player, clips, states } = fixture();
  const playing = player.play('/clip.wav');
  const count = states.length;
  player.stop(false);
  clips[0].pending.resolve();
  await playing;
  assert.equal(states.length, count);
  assert.equal(clips[0].released, true);
  // React StrictMode's cleanup/setup cycle must leave the controller reusable.
  const retry = player.play('/clip.wav');
  clips[1].pending.resolve();
  await retry;
  assert.equal(states.at(-1).status, 'playing');
});
