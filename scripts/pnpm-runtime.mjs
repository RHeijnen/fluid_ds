export function resolvePinnedPnpm(
  packageManager,
  { env = process.env, platform = process.platform } = {}
) {
  const expected = /^pnpm@(\d+\.\d+\.\d+)$/.exec(packageManager ?? "")?.[1];
  if (!expected) throw new Error("packageManager must pin an exact pnpm version");

  const actual = /^pnpm\/([^\s]+)/.exec(env.npm_config_user_agent ?? "")?.[1];
  if (actual !== expected) {
    throw new Error(
      `The active pnpm version must match packageManager: expected ${expected}, received ${actual ?? "unknown"}`
    );
  }

  // CI installs the exact packageManager version with pnpm/action-setup. Node 24
  // no longer guarantees a sibling Corepack command, so use that verified pnpm
  // executable instead of assuming a bundled Corepack layout.
  return platform === "win32" ? "pnpm.cmd" : "pnpm";
}
