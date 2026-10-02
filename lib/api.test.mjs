import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWeatherData } from './api.ts';

const validResponse = () => ({
  timezone: 'Europe/Paris',
  current: {
    time: 1000,
    temperature_2m: 18,
    relative_humidity_2m: 70,
    is_day: 1,
    weather_code: 3,
    wind_speed_10m: 12,
    pressure_msl: 1014,
  },
  hourly: {
    time: [0, 1000, 2000],
    temperature_2m: [17, 18, 19],
    precipitation_probability: [10, 20, 30],
    weather_code: [3, 3, 2],
    wind_speed_10m: [8, 12, 9],
    visibility: [20000, 18000, 19000],
    is_day: [0, 1, 1],
  },
  daily: {
    time: [0, 86400],
    weather_code: [3, 2],
    temperature_2m_max: [20, 21],
    temperature_2m_min: [12, 13],
    sunrise: [500, 86900],
    sunset: [50000, 136400],
  },
});

test('keeps available weather when optional measurements are null', () => {
  const response = validResponse();
  response.current.wind_speed_10m = null;
  response.hourly.precipitation_probability[1] = null;
  response.hourly.visibility[2] = null;
  response.daily.sunrise[0] = null;

  const weather = parseWeatherData(response);
  assert.ok(weather);
  assert.equal(weather.current.wind_speed_10m, null);
  assert.deepEqual(weather.hourly.precipitation_probability, [10, null, 30]);
  assert.deepEqual(weather.hourly.visibility, [20000, 18000, null]);
  assert.deepEqual(weather.daily.sunrise, [null, 86900]);
});

test('fills an omitted secondary series with unavailable values', () => {
  const response = validResponse();
  delete response.hourly.visibility;

  const weather = parseWeatherData(response);
  assert.ok(weather);
  assert.deepEqual(weather.hourly.visibility, [null, null, null]);
});

test('skips incomplete later forecast rows without rejecting current weather', () => {
  const response = validResponse();
  response.hourly.temperature_2m[2] = null;
  response.daily.temperature_2m_max[1] = null;

  const weather = parseWeatherData(response);
  assert.ok(weather);
  assert.deepEqual(weather.hourly.time, [0, 1000]);
  assert.deepEqual(weather.daily.time, [0]);
});

test('rejects a response with no usable current or future hourly data', () => {
  const response = validResponse();
  response.hourly.temperature_2m[1] = null;
  response.hourly.temperature_2m[2] = null;

  assert.equal(parseWeatherData(response), null);
});
