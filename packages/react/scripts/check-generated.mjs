// Kept as the public script entry; verification must not regenerate away drift.
process.argv.push("--check");
await import("./generate.mjs");
