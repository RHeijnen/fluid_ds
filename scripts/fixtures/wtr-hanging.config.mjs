// Real WTR config evaluation never resolves. The rescue only bounds RED tests
// against the old supervisor, and must never be mistaken for successful cleanup.
process.send({ type: "fixture-config-entered", detail: { workerPid: process.pid } });
setTimeout(() => process.exit(71), 8000);
await new Promise(() => {});
export default {};
