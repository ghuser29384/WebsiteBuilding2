type CommitmentMetricFields = Record<string, string | number | boolean | null | undefined>;

const redactField = (key: string, value: unknown): unknown => {
  if (/secret|token|key|password|authorization/i.test(key)) return "[redacted]";
  return value;
};

export const recordCommitmentMetric = (event: string, fields: CommitmentMetricFields = {}): void => {
  if (process.env.COMMITMENT_STRUCTURED_LOGS === "false") return;
  const payload: Record<string, unknown> = {
    scope: "commitments",
    event,
    at: new Date().toISOString(),
  };
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined) return;
    payload[key] = redactField(key, value);
  });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
};
