/**
 * Component dependency version compatibility.
 *
 * `ComponentDependency.version` was declared but never enforced, so a component depending on
 * `x@2.0.0` activated happily against an installed `x@1.0.0` — an incompatibility the user would
 * meet as a runtime failure instead of a refusal with a reason. `12-capability---skill---plugin-system.md`
 * §5 requires incompatible versions to be *absent with a visible explanation*, and §12 requires the
 * component to stay installed but disabled. This is the comparison behind both.
 *
 * Policy: **same major, and installed >= required** — caret semantics, the least surprising reading
 * of a bare `"2.1.0"`. Ranges (`^`, `~`, `>=`, `||`) are deliberately unsupported: `semver` is not a
 * dependency of this browser-safe, data-only package, and adding one to express a policy no real
 * Component has needed yet would be speculative. The moment a Component ships a genuine range,
 * that is the moment to take the dependency.
 */

/** A parsed `major.minor.patch`. Extra dot-segments and any pre-release/build suffix are ignored. */
function parse(version: string): [number, number, number] | null {
  const core = version.trim().split(/[-+]/, 1)[0] ?? ''
  const parts = core.split('.')
  if (parts.length < 1 || parts.length > 4) return null
  const nums = parts.slice(0, 3).map(part => (/^\d+$/.test(part) ? Number(part) : Number.NaN))
  while (nums.length < 3) nums.push(0)
  return nums.some(Number.isNaN) ? null : [nums[0]!, nums[1]!, nums[2]!]
}

/**
 * Is `installed` usable where `required` was declared?
 *
 * Returns false when either version is unparseable: an unreadable version is not a compatible one,
 * and silently admitting it would reintroduce exactly the hole this closes.
 */
export function isVersionCompatible(installed: string, required: string): boolean {
  const a = parse(installed)
  const b = parse(required)
  if (!a || !b) return false
  if (a[0] !== b[0]) return false
  if (a[1] !== b[1]) return a[1] > b[1]
  return a[2] >= b[2]
}
