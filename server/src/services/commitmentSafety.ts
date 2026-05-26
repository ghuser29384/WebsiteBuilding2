export type CommitmentSafetyCategory =
  | "self-harm related"
  | "illegal or abusive"
  | "medically dangerous"
  | "financially predatory"
  | "abusive toward another person";

export interface CommitmentSafetyResult {
  ok: boolean;
  category?: CommitmentSafetyCategory;
  message?: string;
}

interface UnsafePattern {
  pattern: RegExp;
  category: CommitmentSafetyCategory;
}

const UNSAFE_PATTERNS: UnsafePattern[] = [
  {
    pattern: /\b(suicide|self-harm|self harm|cut myself|kill myself|harm myself|starve myself)\b/i,
    category: "self-harm related",
  },
  {
    pattern: /\b(illegal|steal|theft|fraud|blackmail|bribe|assault|vandalize|evade taxes)\b/i,
    category: "illegal or abusive",
  },
  {
    pattern: /\b(stop taking|quit taking|skip medication|refuse insulin|avoid doctor|ignore medical advice)\b/i,
    category: "medically dangerous",
  },
  {
    pattern: /\b(send money|wire money|pay me|crypto wallet|private key|seed phrase|bank password)\b/i,
    category: "financially predatory",
  },
  {
    pattern: /\b(harass|dox|doxx|stalk|threaten|intimidate|humiliate)\b/i,
    category: "abusive toward another person",
  },
];

const ACTION_TEXT_KEYS = new Set([
  "action",
  "actionplan",
  "actiontemplate",
  "commitment",
  "commitmenttext",
  "implementationnote",
  "requiredaction",
]);

const normalizeKey = (key: string): string => key.toLowerCase().replace(/[^a-z0-9]/g, "");

const collectActionText = (value: unknown, keyHint = "", output: string[] = []): string[] => {
  if (typeof value === "string") {
    if (!keyHint || ACTION_TEXT_KEYS.has(normalizeKey(keyHint))) {
      output.push(value);
    }
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectActionText(item, keyHint, output));
    return output;
  }

  if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      collectActionText(item, key, output);
    });
  }

  return output;
};

export const validateCommitmentActionSafety = (text: string): CommitmentSafetyResult => {
  const matched = UNSAFE_PATTERNS.find((item) => item.pattern.test(text));
  if (!matched) return { ok: true };

  return {
    ok: false,
    category: matched.category,
    message:
      "Commitment implication requires a safe, lawful, personally actionable obligation; this action appears " +
      matched.category +
      ".",
  };
};

export const validateCommitmentPayloadSafety = (payload: unknown): CommitmentSafetyResult => {
  const actionTexts = collectActionText(payload).map((item) => item.trim()).filter(Boolean);
  for (const actionText of actionTexts) {
    const result = validateCommitmentActionSafety(actionText);
    if (!result.ok) return result;
  }
  return { ok: true };
};
