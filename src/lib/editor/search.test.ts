import { describe, expect, it } from 'vitest';
import { MatchRank, scoreMatch } from './search';

describe('scoreMatch', () => {
  it('ranks a prefix highest', () => {
    expect(scoreMatch('Lambda', 'lam')).toBe(MatchRank.Prefix);
  });

  it('ranks the start of a later word above a mid-word hit', () => {
    // The case that sent "Historial" above "Generar con IA".
    expect(scoreMatch('Generar con IA', 'ia')).toBe(MatchRank.WordStart);
    expect(scoreMatch('Historial', 'ia')).toBe(MatchRank.Substring);
    expect(scoreMatch('Generar con IA', 'ia')).toBeGreaterThan(scoreMatch('Historial', 'ia'));
  });

  it('treats a hyphen as a word break, as service keys use them', () => {
    expect(scoreMatch('aws-lambda', 'lambda')).toBe(MatchRank.WordStart);
  });

  it('reports no match', () => {
    expect(scoreMatch('Lambda', 'zzz')).toBe(MatchRank.None);
  });

  it('matches everything on an empty needle', () => {
    expect(scoreMatch('anything', '')).toBe(MatchRank.Prefix);
  });

  it('is case-insensitive on the haystack', () => {
    expect(scoreMatch('DynamoDB', 'dynamo')).toBe(MatchRank.Prefix);
  });
});
