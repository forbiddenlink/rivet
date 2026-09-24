/**
 * OpenAI model selection, in one place.
 *
 * Model ids were previously hardcoded in four files with three different values
 * (`gpt-4` in the enhancer, the CLI flag, and `.rivetrc.json`; `gpt-4o-mini` in the
 * web explain route), and `OPENAI_MODEL` in `.env.example` was read by nothing.
 * Every id below was taken from https://developers.openai.com/api/docs/models.
 */

/**
 * Default for the CLI `--ai` pass. The user opts into this per scan and wants a
 * genuine read of the finding, so it uses the model built for coding work.
 */
export const DEFAULT_OPENAI_MODEL = 'gpt-6-sol'

/**
 * Default for the public web explain endpoint. That route is unauthenticated and
 * high volume, and each call produces a few short paragraphs, so it defaults to
 * the efficient model rather than the expensive one.
 */
export const DEFAULT_EXPLAIN_MODEL = 'gpt-6-luna'

/**
 * Resolve the model to use, preferring an explicit argument, then `OPENAI_MODEL`,
 * then the supplied default.
 */
export function resolveModel(explicit?: string, fallback: string = DEFAULT_OPENAI_MODEL): string {
  return explicit || process.env.OPENAI_MODEL || fallback
}
