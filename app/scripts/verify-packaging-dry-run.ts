/**
 * Unsigned packaging dry run.
 * Validates third-party notices, workspace version metadata, and the local
 * electron-builder artifact layout. This process does not run electron-builder,
 * does not sign, and does not publish an update feed.
 */

import './verify-release-independence.ts'
