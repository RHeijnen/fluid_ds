import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const execute = promisify(execFile);
let linuxClockTicks;

/** Capture the native creation clock before/after spawning the owned worker. */
export async function processBirthBoundary() {
  if (process.platform === "win32") {
    const { stdout } = await execute(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-WindowStyle",
        "Hidden",
        "-Command",
        `Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class FluidCreationClock { [DllImport("kernel32.dll")] static extern void GetSystemTimePreciseAsFileTime(out long value); public static long Read() { long value; GetSystemTimePreciseAsFileTime(out value); return DateTime.FromFileTimeUtc(value).Ticks; } }'; [FluidCreationClock]::Read().ToString()`
      ],
      { windowsHide: true, timeout: 10000 }
    );
    if (!/^\d+$/.test(stdout.trim())) throw new Error("Invalid native Windows creation clock");
    const ticks = BigInt(stdout.trim());
    return {
      clock: "windows-ticks",
      // CIM serializes microseconds. Node Date.now can lag the native process
      // creation clock on Windows and must not define this safety boundary.
      birth: (ticks - (ticks % 10n)).toString(),
      resolution: "10"
    };
  }
  if (process.platform === "linux") {
    linuxClockTicks ??= execute("getconf", ["CLK_TCK"], { timeout: 10000 }).then(({ stdout }) => {
      if (!/^\d+$/.test(stdout.trim())) throw new Error("Invalid Linux clock tick frequency");
      return BigInt(stdout.trim());
    });
    const frequency = await linuxClockTicks;
    const uptime = (await readFile("/proc/uptime", "utf8")).split(" ")[0];
    if (!/^\d+\.\d+$/.test(uptime)) throw new Error("Invalid Linux uptime clock");
    const [seconds, fraction] = uptime.split(".");
    const denominator = 10n ** BigInt(fraction.length);
    return {
      clock: "linux-ticks",
      birth: (
        BigInt(seconds) * frequency +
        (BigInt(fraction) * frequency) / denominator
      ).toString(),
      resolution: ((frequency + denominator - 1n) / denominator).toString()
    };
  }
  throw new Error(`Verified process ownership is not supported on ${process.platform}`);
}

export function parseLinuxProcessStat(text) {
  const opening = text.indexOf("(");
  const closing = text.lastIndexOf(")");
  const fields = text
    .slice(closing + 1)
    .trim()
    .split(/\s+/);
  const pid = Number(text.slice(0, opening).trim());
  const parent = Number(fields[1]);
  if (
    opening < 1 ||
    closing < opening ||
    !Number.isInteger(pid) ||
    !Number.isInteger(parent) ||
    !/^\d+$/.test(fields[19] ?? "")
  )
    throw new Error("Invalid Linux process stat");
  return {
    pid,
    parent,
    birth: fields[19],
    clock: "linux-ticks",
    name: text.slice(opening + 1, closing)
  };
}

/** Record PID plus birth identity; never kill by executable name. */
export async function processSnapshot({ signal } = {}) {
  signal?.throwIfAborted();
  if (process.platform === "win32") {
    const { stdout } = await execute(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-WindowStyle",
        "Hidden",
        "-Command",
        "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,@{Name='Birth';Expression={$_.CreationDate.ToUniversalTime().Ticks.ToString()}},Name | ConvertTo-Json -Compress"
      ],
      { windowsHide: true, timeout: 10000, maxBuffer: 4 * 1024 * 1024, signal }
    );
    const rows = JSON.parse(stdout || "[]");
    return (Array.isArray(rows) ? rows : [rows]).map((row) => ({
      pid: row.ProcessId,
      parent: row.ParentProcessId,
      birth: row.Birth,
      clock: "windows-ticks",
      name: row.Name
    }));
  }
  if (process.platform !== "linux")
    throw new Error(`Verified process ownership is not supported on ${process.platform}`);
  const entries = (await readdir("/proc")).filter((name) => /^\d+$/.test(name));
  signal?.throwIfAborted();
  const rows = await Promise.all(
    entries.map(async (name) => {
      try {
        return parseLinuxProcessStat(
          await readFile(`/proc/${name}/stat`, { encoding: "utf8", signal })
        );
      } catch (error) {
        if (error.code === "ENOENT" || error.code === "ESRCH") return null;
        throw error;
      }
    })
  );
  return rows.filter(Boolean);
}

const clocks = new Set(["windows-ticks", "linux-ticks"]);
const birthValue = (entry) =>
  clocks.has(entry?.clock) && /^\d+$/.test(entry.birth ?? "") ? BigInt(entry.birth) : null;
const sameIdentity = (a, b) => a?.pid === b?.pid && a?.birth === b?.birth && a?.clock === b?.clock;
const compareBirth = (a, b) => {
  const first = birthValue(a);
  const second = birthValue(b);
  if (first === null || second === null || a.clock !== b.clock) return null;
  return first < second ? -1 : first > second ? 1 : 0;
};
const followsParent = (entry, parent) => {
  const order = compareBirth(entry, parent);
  // Linux exposes process start time in scheduler ticks. A fork/exec child can
  // legitimately share its live parent's tick, while /proc still provides the
  // current parent edge. Windows PPIDs can outlive the parent, so equality must
  // remain ambiguous there to preserve the PID-reuse boundary.
  return order === 1 || (order === 0 && entry.clock === "linux-ticks");
};
function matchesRoot(entry, scope) {
  const birth = birthValue(entry);
  if (
    !scope ||
    birth === null ||
    entry.pid !== scope.pid ||
    entry.parent !== scope.parentPid ||
    entry.pid === entry.parent ||
    entry.clock !== scope.clock ||
    !/^\d+$/.test(scope.notBefore ?? "") ||
    !/^\d+$/.test(scope.notAfter ?? "")
  )
    return false;
  return birth >= BigInt(scope.notBefore) && birth <= BigInt(scope.notAfter);
}

/** Validate every immutable observed edge, including ancestors that already exited. */
export function hasOwnershipProof(entry, known, scope, seen = new Set()) {
  if (!entry || seen.has(entry.pid)) return false;
  seen.add(entry.pid);
  if (entry.pid === scope?.pid)
    return entry.ownership?.kind === "worker" && matchesRoot(entry, scope);
  const parent = known.get(entry.parent);
  return (
    entry.ownership?.kind === "descendant" &&
    entry.ownership.parentBirth === parent?.birth &&
    entry.ownership.parentClock === parent?.clock &&
    followsParent(entry, parent) &&
    hasOwnershipProof(parent, known, scope, seen)
  );
}

export function collectOwned(snapshot, rootPid, known, { root: scope, uncertain = [] } = {}) {
  if (!scope || scope.pid !== rootPid)
    throw new Error("Process ownership requires the worker spawn identity");
  const current = new Map(snapshot.map((entry) => [entry.pid, entry]));
  const root = snapshot.find((entry) => entry.pid === rootPid);
  if (root && !known.has(rootPid) && scope.canSeed) {
    if (matchesRoot(root, scope)) known.set(rootPid, { ...root, ownership: { kind: "worker" } });
    else uncertain.push({ ...root, reason: "worker-spawn-identity-mismatch" });
  }
  let added = true;
  while (added) {
    added = false;
    for (const entry of snapshot) {
      const parent = known.get(entry.parent);
      const currentParent = current.get(entry.parent);
      if (
        entry.pid === entry.parent ||
        !parent ||
        !sameIdentity(currentParent, parent) ||
        !hasOwnershipProof(parent, known, scope)
      )
        continue;
      if (known.has(entry.pid)) {
        if (
          !sameIdentity(known.get(entry.pid), entry) &&
          !uncertain.some((candidate) => sameIdentity(candidate, entry))
        )
          uncertain.push({ ...entry, reason: "owned-pid-reused-without-generation-proof" });
        continue;
      }
      const order = compareBirth(entry, parent);
      if (!followsParent(entry, parent)) {
        // Windows retains the original PPID after a parent exits. An older process
        // can therefore refer to a PID now used by an unrelated new worker child.
        if (order === -1 && compareBirth(entry, known.get(rootPid)) === -1) continue;
        if (!uncertain.some((candidate) => sameIdentity(candidate, entry)))
          uncertain.push({
            ...entry,
            reason:
              order === -1
                ? "child-predates-current-parent-after-worker-start"
                : "child-birth-order-unproven"
          });
        continue;
      }
      known.set(entry.pid, {
        ...entry,
        ownership: { kind: "descendant", parentBirth: parent.birth, parentClock: parent.clock }
      });
      added = true;
    }
  }
  return snapshot.filter(
    (entry) =>
      sameIdentity(known.get(entry.pid), entry) &&
      hasOwnershipProof(known.get(entry.pid), known, scope)
  );
}

/** Pure target selection is separately tested; unknown ancestry never becomes a target. */
export function selectOwnedTargets(current, known, scope) {
  return current.filter(
    (entry) =>
      sameIdentity(known.get(entry.pid), entry) &&
      hasOwnershipProof(known.get(entry.pid), known, scope)
  );
}

export async function terminateOwned(known, scope, { signal } = {}) {
  signal?.throwIfAborted();
  const current = await processSnapshot({ signal });
  signal?.throwIfAborted();
  const matching = selectOwnedTargets(current, known, scope);
  // Children first. Every target was observed in this worker's process ancestry.
  const depth = (entry) => {
    let value = 0;
    for (
      let parent = known.get(entry.parent);
      parent && value < known.size;
      parent = known.get(parent.parent)
    )
      value++;
    return value;
  };
  matching.sort((a, b) => depth(b) - depth(a));
  if (process.platform === "win32" && matching.length) {
    const targets = JSON.stringify(matching.map(({ pid, birth }) => ({ pid, birth })));
    signal?.throwIfAborted();
    const { stdout } = await execute(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-WindowStyle",
        "Hidden",
        "-File",
        fileURLToPath(new URL("./wtr-terminate-windows.ps1", import.meta.url)),
        "-TargetsJson",
        targets
      ],
      { windowsHide: true, timeout: 10000, maxBuffer: 1024 * 1024, signal }
    );
    const results = JSON.parse(stdout || "[]");
    return Array.isArray(results) ? results : [results];
  }
  if (process.platform === "linux" && matching.length) {
    signal?.throwIfAborted();
    const { stdout } = await execute(
      "python3",
      [
        fileURLToPath(new URL("./wtr-terminate-linux.py", import.meta.url)),
        JSON.stringify(matching.map(({ pid, birth }) => ({ pid, birth })))
      ],
      { timeout: 10000, maxBuffer: 1024 * 1024, signal }
    );
    return JSON.parse(stdout);
  }
  return [];
}
