export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const RESEARCH_CREDIT_COST = 1;
export const WELCOME_CREDITS = 100;
export const RESEARCH_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";
