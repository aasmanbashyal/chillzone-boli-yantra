import base from './playwright.config.js';

export default { ...base, testDir: './tests/live', timeout: 300000, workers: 1 };
