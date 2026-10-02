import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewLaunch } from './review-zcode.mjs';

test('repeat launches retain one Electron profile and all six existing stores', () => {
  const first = reviewLaunch('/project', { ELECTRON_RUN_AS_NODE: '1', HOME: '/owner' }, 'darwin');
  const second = reviewLaunch('/project', {}, 'darwin');
  for (const key of ['ZCODE_DATA_BASE_DIR', 'ZCODE_DESKTOP_USER_DATA_DIR', 'ZCODE_DESKTOP_HOME_DIR', 'ZCODE_STORAGE_DIR', 'ZCODE_HOME', 'ZCODE_SESSION_DB']) {
    assert.equal(first.env[key], second.env[key]);
    assert.ok(first.env[key].startsWith(first.profile + '/'));
  }
  assert.equal(first.env.HOME, '/owner');
  assert.equal(first.env.ELECTRON_RUN_AS_NODE, undefined);
  assert.equal(first.executable, second.executable);
  assert.deepEqual(first.args, second.args);
  assert.ok(!first.executable.includes('.fleet/reviews/'), 'Another review app was cloned');
});

test('launch arguments preserve project paths without shell interpolation', () => {
  const launch = reviewLaunch('/project with spaces/天工', {}, 'linux');
  assert.equal(launch.args[0], '/project with spaces/天工/.fleet/zcode/packages/desktop');
  assert.ok(launch.executable.endsWith('/electron'));
  assert.ok(reviewLaunch('/project', {}, 'win32').executable.endsWith('/electron.exe'));
});
