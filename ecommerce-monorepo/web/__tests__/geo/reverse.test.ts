import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isCoordinateAddress,
  parseCoordinates,
  getOfflineLocationName,
  cleanAddressDisplay,
} from '@/lib/geo/coordinateResolver';
import { GET } from '@/app/api/geo/reverse/route';
import { NextRequest } from 'next/server';

describe('Coordinate Resolver & Address Display Sanitizer', () => {
  it('correctly detects raw coordinate addresses and numbers', () => {
    expect(isCoordinateAddress('55.75604, 37.61317')).toBe(true);
    expect(isCoordinateAddress('55.75604, Russia')).toBe(true);
    expect(isCoordinateAddress('55.75604,Россия')).toBe(true);
    expect(isCoordinateAddress('55.75604')).toBe(true);
    expect(isCoordinateAddress('-23.4567, 120.3456')).toBe(true);

    expect(isCoordinateAddress('Moscow, Russia')).toBe(false);
    expect(isCoordinateAddress('Москва, Россия')).toBe(false);
    expect(isCoordinateAddress('Tverskaya 12, Moscow, Russia')).toBe(false);
    expect(isCoordinateAddress('Minsk, Belarus')).toBe(false);
    expect(isCoordinateAddress('Worldwide Shipping')).toBe(false);
  });

  it('parses valid coordinates accurately', () => {
    const coords = parseCoordinates('55.75604, 37.61317');
    expect(coords).not.toBeNull();
    expect(coords?.lat).toBeCloseTo(55.75604);
    expect(coords?.lng).toBeCloseTo(37.61317);
  });

  it('maps coordinates to localized city and country using offline dictionary', () => {
    // Moscow coordinates
    const moscowEn = getOfflineLocationName(55.75604, 37.61317, 'en');
    expect(moscowEn.city).toBe('Moscow');
    expect(moscowEn.country).toBe('Russia');
    expect(moscowEn.formattedAddress).toBe('Moscow, Russia');

    const moscowRu = getOfflineLocationName(55.75604, 37.61317, 'ru');
    expect(moscowRu.city).toBe('Москва');
    expect(moscowRu.country).toBe('Россия');
    expect(moscowRu.formattedAddress).toBe('Москва, Россия');

    // Minsk coordinates
    const minskRu = getOfflineLocationName(53.9006, 27.5590, 'ru');
    expect(minskRu.city).toBe('Минск');
    expect(minskRu.country).toBe('Беларусь');

    // Yiwu coordinates
    const yiwuEn = getOfflineLocationName(29.3069, 120.0754, 'en');
    expect(yiwuEn.city).toBe('Yiwu');
    expect(yiwuEn.country).toBe('China');
  });

  it('cleans coordinate addresses so raw floats are never shown to the user', () => {
    expect(cleanAddressDisplay('55.75604, 37.61317', 'en')).toBe('Moscow, Russia');
    expect(cleanAddressDisplay('55.75604, 37.61317', 'ru')).toBe('Москва, Россия');
    expect(cleanAddressDisplay('55.75604, Russia', 'en')).toBe('Moscow, Russia');
    expect(cleanAddressDisplay('55.75604, Russia', 'ru')).toBe('Москва, Россия');

    // Human-readable addresses must stay intact
    expect(cleanAddressDisplay('Tverskaya 10, Moscow, Russia', 'en')).toBe('Tverskaya 10, Moscow, Russia');
    expect(cleanAddressDisplay('Минск, Беларусь', 'ru')).toBe('Минск, Беларусь');
  });
});

describe('Reverse Geocoding API (/api/geo/reverse)', () => {
  it('returns valid reverse geocoded address without returning raw numbers', async () => {
    const req = new NextRequest('http://localhost:3001/api/geo/reverse?lat=55.75604&lng=37.61317&locale=en');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.address).toBeDefined();
    expect(data.address.city).not.toMatch(/^[-+]?\d+\.\d+$/);
    expect(data.address.formattedAddress).not.toMatch(/^[-+]?\d+\.\d+,\s*[-+]?\d+\.\d+$/);
    expect(data.address.country).toBeDefined();
  });
});
