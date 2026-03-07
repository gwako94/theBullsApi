import { generateIcfcIdWithModel } from './id-generator';
import { expect, test } from '@jest/globals';

test('generates IDs with expected format and uniqueness', () => {
  const userId = generateIcfcIdWithModel('user');
  expect(userId.startsWith('icfc_user_')).toBe(true);

  const mixedCaseId = generateIcfcIdWithModel('MyModel');
  expect(mixedCaseId.startsWith('icfc_mymodel_')).toBe(true);

  const defaultLengthId = generateIcfcIdWithModel('player');
  const defaultRandomPart = defaultLengthId.replace('icfc_player_', '');
  expect(defaultRandomPart).toHaveLength(12);

  const customLengthId = generateIcfcIdWithModel('match', 16);
  const customRandomPart = customLengthId.replace('icfc_match_', '');
  expect(customRandomPart).toHaveLength(16);

  const count = 1000;
  const ids = new Set<string>();
  for (let i = 0; i < count; i++) {
    ids.add(generateIcfcIdWithModel('article'));
  }
  expect(ids.size).toBe(count);
});
