/** Input caps. Every persona call carries the scenario, so longer text only costs tokens. */
export const LIMITS = {
  scenario: 4_000,
  minN: 3,
  maxN: 12,
  defaultN: 8,
  customField: 200,
  maxBodyBytes: 30_000,
} as const
