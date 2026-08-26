/**
 * Ranking for the command palette.
 *
 * A plain substring test is not enough: searching "IA" matched the middle of
 * "Historial" as strongly as the words "con IA", so the wrong row came first.
 * Matches at the start of the text rank highest, then matches at the start of
 * any word, then anything else.
 */
export const enum MatchRank {
  None = 0,
  Substring = 1,
  WordStart = 2,
  Prefix = 3,
}

export function scoreMatch(haystack: string, needle: string): MatchRank {
  if (!needle) return MatchRank.Prefix;
  const text = haystack.toLowerCase();
  const index = text.indexOf(needle);
  if (index === -1) return MatchRank.None;
  if (index === 0) return MatchRank.Prefix;
  // A non-alphanumeric character before the match means a new word starts here.
  return /[^a-z0-9]/.test(text[index - 1]) ? MatchRank.WordStart : MatchRank.Substring;
}
