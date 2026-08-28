import assert from "node:assert/strict";
import test from "node:test";
import { collectOwned, parseLinuxProcessStat, selectOwnedTargets } from "./wtr-process-tree.mjs";
import { auditOwnershipEvidence } from "./audit-wtr-process-ownership.mjs";

const process = (pid, parent, birth, clock = "windows-ticks") => ({
  pid,
  parent,
  birth: String(birth),
  clock,
  name: "same-name.exe"
});
const root = process(10, 1, 100);
const scope = {
  pid: 10,
  parentPid: 1,
  clock: "windows-ticks",
  notBefore: "99",
  notAfter: "101",
  canSeed: true
};
const capture = (rows, known = new Map(), options = {}) => {
  const uncertain = [];
  const owned = collectOwned(rows, 10, known, { root: scope, uncertain, ...options });
  return { owned, known, uncertain };
};

test("an old child of a reused parent PID is never owned", () => {
  const esbuild = process(20, 10, "639233503512615750");
  const oldWindowsProcess = process(30, 20, "639233230586011080");
  const worker = process(10, 1, "639233500000000000");
  const result = capture([worker, esbuild, oldWindowsProcess], new Map(), {
    root: { ...scope, notBefore: "639233499999999999", notAfter: "639233500000000001" }
  });
  assert.deepEqual(result.owned, [worker, esbuild]);
  assert.equal(result.known.has(oldWindowsProcess.pid), false);
  assert.deepEqual(result.uncertain, []);
});

test("an old false ancestor cannot confer ownership on fresh descendants", () => {
  const parent = process(20, 10, 200);
  const oldAncestor = process(30, 20, 50);
  const freshDescendant = process(40, 30, 300);
  assert.deepEqual(capture([freshDescendant, oldAncestor, parent, root]).owned, [parent, root]);
});

test("old orphan parent reuse after an observed ancestor exits cannot acquire ownership", () => {
  const known = new Map();
  const parent = process(20, 10, 200);
  capture([root, parent], known);
  const replacement = process(20, 1, 400);
  const orphan = process(30, 20, 300);
  assert.deepEqual(capture([root, replacement, orphan], known).owned, [root]);
  assert.equal(known.has(orphan.pid), false);
});

test("the initial worker PID requires supervisor ancestry and the spawn birth window", () => {
  for (const candidate of [
    { ...root, parent: 999 },
    { ...root, birth: "98" },
    { ...root, birth: "102" },
    { ...root, birth: "unparseable" },
    { ...root, clock: "unknown" }
  ]) {
    const result = capture([candidate]);
    assert.deepEqual(result.owned, []);
    assert.equal(result.known.size, 0);
    assert.ok(result.uncertain.length);
  }
  assert.deepEqual(capture([root], new Map(), { root: { ...scope, canSeed: false } }).owned, []);
});

test("same-tick Linux children are owned while Windows equality remains uncertain", () => {
  const linuxWorker = { ...root, clock: "linux-ticks" };
  const linuxChild = process(20, 10, "100", "linux-ticks");
  const linux = capture([linuxWorker, linuxChild], new Map(), {
    root: { ...scope, clock: "linux-ticks" }
  });
  assert.deepEqual(linux.owned, [linuxWorker, linuxChild]);
  assert.deepEqual(linux.uncertain, []);

  const windowsChild = process(20, 10, "100");
  const windows = capture([root, windowsChild]);
  assert.deepEqual(windows.owned, [root]);
  assert.equal(windows.known.has(windowsChild.pid), false);
  assert.ok(windows.uncertain.some((entry) => entry.pid === windowsChild.pid));
});

test("unparseable child births are uncertain on every clock", () => {
  for (const clock of ["windows-ticks", "linux-ticks"]) {
    const worker = { ...root, clock };
    const child = process(20, 10, "unknown", clock);
    const result = capture([worker, child], new Map(), { root: { ...scope, clock } });
    assert.deepEqual(result.owned, [worker]);
    assert.equal(result.known.has(child.pid), false);
    assert.ok(result.uncertain.some((entry) => entry.pid === child.pid));
  }
});

test("a child predating its current parent but newer than this worker is uncertain", () => {
  const parent = process(20, 10, 300);
  const ambiguousOrphan = process(30, 20, 200);
  const result = capture([root, parent, ambiguousOrphan]);
  assert.deepEqual(result.owned, [root, parent]);
  assert.ok(result.uncertain.some((entry) => entry.pid === ambiguousOrphan.pid));
});

test("fresh transitive descendants stay owned after their proven parent exits", () => {
  const parent = process(20, 10, 200);
  const child = process(30, 20, 300);
  const known = new Map();
  assert.deepEqual(capture([child, parent, root], known).owned, [child, parent, root]);
  assert.deepEqual(capture([child], known, { root: { ...scope, canSeed: false } }).owned, [child]);
  assert.deepEqual(capture([{ ...child, birth: "400" }], known).owned, []);
});

test("self-parenting and cycles cannot become owned", () => {
  const self = process(20, 20, 200);
  const a = process(30, 40, 300);
  const b = process(40, 30, 400);
  assert.deepEqual(capture([self, a, b, root]).owned, [root]);
});

test("birth ordering preserves precision beyond Number safe integer range", () => {
  const worker = process(10, 1, "639233500000000000");
  const child = process(20, 10, "639233500000000001");
  const equal = process(30, 10, worker.birth);
  const result = capture([worker, child, equal], new Map(), {
    root: { ...scope, notBefore: worker.birth, notAfter: worker.birth }
  });
  assert.deepEqual(result.owned, [worker, child]);
  assert.ok(result.uncertain.some((entry) => entry.pid === equal.pid));
});

test("cleanup target selection revalidates the complete immutable ancestry proof", () => {
  const parent = process(20, 10, 200);
  const child = process(30, 20, 300);
  const known = capture([root, parent, child]).known;
  assert.deepEqual(selectOwnedTargets([child], known, scope), [child]);
  known.set(parent.pid, { ...known.get(parent.pid), birth: "400" });
  assert.deepEqual(selectOwnedTargets([child], known, scope), []);
  assert.deepEqual(
    selectOwnedTargets(
      [root, parent, child],
      new Map([
        [10, root],
        [20, parent],
        [30, child]
      ]),
      scope
    ),
    []
  );
});

test("Linux process identity uses native start ticks and safely parses parenthesized names", () => {
  const fields = ["S", "10", ...Array(17).fill("0"), "1234567890123456789", "0"];
  assert.deepEqual(parseLinuxProcessStat(`20 (a name (with) parentheses) ${fields.join(" ")}`), {
    pid: 20,
    parent: 10,
    birth: "1234567890123456789",
    clock: "linux-ticks",
    name: "a name (with) parentheses"
  });
  assert.throws(() => parseLinuxProcessStat("20 (bad) S 10"), /Invalid/);
});

test("a reused owned PID requires a new generation proof and cannot silently disappear", () => {
  const first = process(20, 10, 200);
  const known = capture([root, first]).known;
  const replacement = process(20, 10, 300);
  const result = capture([root, replacement], known);
  assert.deepEqual(result.owned, [root]);
  assert.ok(result.uncertain.some((entry) => entry.pid === replacement.pid));
  assert.deepEqual(selectOwnedTargets([replacement], known, scope), []);
});

test("missing or cyclic ownership proofs cannot authorize cleanup", () => {
  assert.throws(() => collectOwned([root], root.pid, new Map()), /spawn identity/);
  const first = {
    ...process(20, 30, 200),
    ownership: { kind: "descendant", parentBirth: "300", parentClock: "windows-ticks" }
  };
  const second = {
    ...process(30, 20, 300),
    ownership: { kind: "descendant", parentBirth: "200", parentClock: "windows-ticks" }
  };
  assert.deepEqual(
    selectOwnedTargets(
      [first, second],
      new Map([
        [20, first],
        [30, second]
      ]),
      scope
    ),
    []
  );
});

test("retained evidence audit identifies unsafe ancestors, descendants, and cleanup requests", () => {
  const parent = process(20, 10, 200);
  const old = process(30, 20, 50);
  const descendant = process(40, 30, 300);
  const cleanup = { pid: 40, birth: "300", terminated: true };
  const report = auditOwnershipEvidence({
    status: "failed",
    observedProcesses: [root, parent, old, descendant],
    cleanup: [cleanup]
  });
  assert.deepEqual(
    report.unsafeProcesses.map((entry) => entry.pid),
    [30, 40]
  );
  assert.deepEqual(report.cleanupAttempts, [cleanup]);
  assert.deepEqual(
    auditOwnershipEvidence({ observedProcesses: [root, parent] }).unsafeProcesses,
    []
  );
});

test("retained evidence audit accepts equal Linux ticks but rejects equal Windows births", () => {
  const linuxRoot = process(10, 1, 100, "linux-ticks");
  const linuxChild = process(20, 10, 100, "linux-ticks");
  assert.deepEqual(
    auditOwnershipEvidence({ observedProcesses: [linuxRoot, linuxChild] }).unsafeProcesses,
    []
  );
  assert.deepEqual(
    auditOwnershipEvidence({ observedProcesses: [root, process(20, 10, 100)] }).unsafeProcesses.map(
      (entry) => entry.pid
    ),
    [20]
  );
});
