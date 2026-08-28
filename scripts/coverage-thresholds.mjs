export function requireCoverageThresholds(packageName, thresholds) {
  const values = thresholds[packageName];
  if (!values) throw new Error(`Missing coverage thresholds for ${packageName}`);
  for (const metric of ["statements", "lines", "functions", "branches"]) {
    if (
      typeof values[metric] !== "number" ||
      !Number.isFinite(values[metric]) ||
      values[metric] < 0 ||
      values[metric] > 100
    ) {
      throw new Error(`Invalid ${metric} coverage threshold for ${packageName}`);
    }
  }
  return values;
}
