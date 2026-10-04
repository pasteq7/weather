import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSavedLocation, parseFavorites, locationKey, resolveLegacyFavorite, readSavedLocation } from './location-preferences.ts';

test('restores exact coordinates, including zero, and rejects corrupt locations', () => {
  assert.deepEqual(parseSavedLocation({ name: ' Greenwich ', lat: 0, lon: 0 }), { name: 'Greenwich', lat: 0, lon: 0 });
  assert.deepEqual(parseSavedLocation({ name: null, lat: 48, lon: 2 }), { name: null, lat: 48, lon: 2 });
  for (const value of [null, [], { name: '', lat: null, lon: null }, { name: 'Paris', lat: 91, lon: 2 },
    { name: 'Paris', lat: 48, lon: NaN }, { name: 'Paris', lat: '48', lon: 2 }]) {
    assert.equal(parseSavedLocation(value), null);
  }
});

test('preserves legacy favorites and distinguishes same-name places by coordinates', () => {
  const favorites = parseFavorites(['Paris', 'Paris', '', null,
    { name: 'Springfield', lat: 39.8, lon: -89.6 },
    { name: 'Springfield', lat: 42.1, lon: -72.6 },
    { name: 'Another label', lat: 39.8, lon: -89.6 },
    { name: 'Invalid', lat: 200, lon: 1 }]);
  assert.equal(favorites.length, 3);
  assert.deepEqual(favorites[0], { name: 'Paris', lat: null, lon: null });
  assert.notEqual(locationKey(favorites[1]), locationKey(favorites[2]));
  assert.deepEqual(parseFavorites({}), []);
});

test('upgrades only the successfully requested legacy favorite', () => {
  const favorites = parseFavorites(['Paris, France', 'Paris, Texas']);
  const upgraded = resolveLegacyFavorite(favorites, 'Paris, France', { name: 'Paris', lat: 48.8, lon: 2.3 });
  assert.deepEqual(upgraded[0], { name: 'Paris, France', lat: 48.8, lon: 2.3 });
  assert.deepEqual(upgraded[1], favorites[1]);
  assert.deepEqual(resolveLegacyFavorite(favorites, 'Other', { name: 'Other', lat: 1, lon: 2 }), favorites);
});

test('unavailable storage is treated as no saved location', () => {
  // Node has no localStorage: the app should use its normal first-visit flow.
  assert.equal(readSavedLocation(), null);
});
