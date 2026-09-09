import { describe, it, expect } from 'vitest';
import { calculateHabitatScore, gradeFor } from './habitatScore';
import type { AnimalProfile } from './types';
import type { Enclosure } from '../types/careCalendar';
import type { TempLog } from '../services/tempLogService';
import type { HumidityLog } from '../services/humidityLogService';

const NOW = new Date('2026-09-09T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const profile = {
  id: 'crested-gecko',
  commonName: 'Crested Gecko',
  scientificName: 'Correlophus ciliatus',
  careLevel: 'beginner',
  minEnclosureSize: { width: 18, depth: 18, height: 24, units: 'in' },
  careTargets: {
    temperature: { min: 72, max: 78, unit: 'F' },
    humidity: { day: { min: 60, max: 80 }, night: { min: 70, max: 90 }, shedding: { min: 70, max: 90 }, unit: '%' },
    lighting: { uvbRequired: true, uvbStrength: '5.0', coveragePercent: 60, photoperiod: '12h/12h' },
    gradient: 'vertical',
  },
  layoutRules: { preferVertical: true, verticalSpacePercent: 60, thermalGradient: 'vertical', requiredZones: [], optionalZones: [] },
  warnings: [],
  bioactiveCompatible: true,
  notes: [],
} as unknown as AnimalProfile;

const enclosure = {
  id: 'e1',
  userId: 'u1',
  name: 'Gecko Tank',
  animalId: 'crested-gecko',
  animalName: 'Crested Gecko',
  substrateType: 'bioactive',
  uvbBulbInstalledOn: daysAgo(30),
  uvbBulbType: 't5-ho',
  isActive: true,
  createdAt: NOW,
  updatedAt: NOW,
} as unknown as Enclosure;

function temp(value: number, ago = 2, zone: TempLog['zone'] = 'ambient'): TempLog {
  return {
    id: `t${value}-${ago}`, enclosureAnimalId: 'a1', userId: 'u1',
    recordedAt: daysAgo(ago).toISOString(), temperatureValue: value, unit: 'f', zone,
    createdAt: '', updatedAt: '',
  };
}

function humidity(value: number, ago = 2): HumidityLog {
  return {
    id: `h${value}-${ago}`, enclosureAnimalId: 'a1', userId: 'u1',
    recordedAt: daysAgo(ago).toISOString(), humidityPercent: value,
    createdAt: '', updatedAt: '',
  };
}

const healthy = () =>
  calculateHabitatScore({
    profile,
    enclosure,
    tempLogs: [temp(75), temp(74)],
    humidityLogs: [humidity(70), humidity(72)],
    dimensions: { width: 18, depth: 18, height: 24, units: 'in' },
    now: NOW,
  });

describe('gradeFor', () => {
  it('maps scores onto letter grades', () => {
    expect(gradeFor(95)).toBe('A');
    expect(gradeFor(85)).toBe('B');
    expect(gradeFor(75)).toBe('C');
    expect(gradeFor(65)).toBe('D');
    expect(gradeFor(20)).toBe('F');
  });
});

describe('calculateHabitatScore — a correct setup', () => {
  it('scores an in-spec enclosure at A with no findings', () => {
    const result = healthy();
    expect(result.grade).toBe('A');
    expect(result.findings).toHaveLength(0);
    expect(result.topFinding).toBeNull();
    expect(result.insufficientData).toBe(false);
  });
});

describe('calculateHabitatScore — temperature', () => {
  it('flags a cold enclosure and drops the grade', () => {
    const result = calculateHabitatScore({
      profile, enclosure,
      tempLogs: [temp(60), temp(61)],
      humidityLogs: [humidity(70)],
      dimensions: { width: 18, depth: 18, height: 24, units: 'in' },
      now: NOW,
    });
    const finding = result.findings.find((f) => f.id === 'temp-low');
    expect(finding?.severity).toBe('critical');
    expect(result.score).toBeLessThan(healthy().score);
  });

  it('flags an overheating enclosure', () => {
    const result = calculateHabitatScore({
      profile, enclosure,
      tempLogs: [temp(90)],
      humidityLogs: [humidity(70)],
      now: NOW,
    });
    expect(result.findings.some((f) => f.id === 'temp-high')).toBe(true);
  });

  it('converts celsius readings before comparing', () => {
    // 24C = 75.2F, comfortably in the 72-78F band.
    const celsius: TempLog = { ...temp(24), unit: 'c' };
    const result = calculateHabitatScore({
      profile, enclosure, tempLogs: [celsius], humidityLogs: [humidity(70)], now: NOW,
    });
    expect(result.findings.some((f) => f.dimension === 'temperature')).toBe(false);
  });

  it('ignores readings older than the freshness window', () => {
    const result = calculateHabitatScore({
      profile, enclosure,
      tempLogs: [temp(50, 90)], // freezing, but three months old
      humidityLogs: [humidity(70)],
      now: NOW,
    });
    const temperature = result.dimensions.find((d) => d.id === 'temperature');
    expect(temperature?.score).toBeNull();
    expect(result.findings.some((f) => f.id === 'monitoring-no-temp')).toBe(true);
  });

  it('prefers the keeper’s enclosure baseline over the species preset', () => {
    const warmBaseline = { ...enclosure, baselineDayTempTarget: 85, baselineNightTempTarget: 95 } as Enclosure;
    const result = calculateHabitatScore({
      profile, enclosure: warmBaseline,
      tempLogs: [temp(90)], humidityLogs: [humidity(70)], now: NOW,
    });
    // 90F is out of spec for the species but inside the keeper's own band.
    expect(result.findings.some((f) => f.dimension === 'temperature')).toBe(false);
  });
});

describe('calculateHabitatScore — UVB', () => {
  it('treats a missing bulb as critical when the species needs UVB', () => {
    const noBulb = { ...enclosure, uvbBulbInstalledOn: undefined } as Enclosure;
    const result = calculateHabitatScore({
      profile, enclosure: noBulb, tempLogs: [temp(75)], humidityLogs: [humidity(70)], now: NOW,
    });
    const finding = result.findings.find((f) => f.id === 'uvb-missing');
    expect(finding?.severity).toBe('critical');
    expect(result.dimensions.find((d) => d.id === 'uvb')?.score).toBe(0);
  });

  it('does not penalise a species that does not need UVB', () => {
    const noUvbSpecies = {
      ...profile,
      careTargets: { ...profile.careTargets, lighting: { ...profile.careTargets.lighting, uvbRequired: false } },
    } as AnimalProfile;
    const noBulb = { ...enclosure, uvbBulbInstalledOn: undefined } as Enclosure;
    const result = calculateHabitatScore({
      profile: noUvbSpecies, enclosure: noBulb,
      tempLogs: [temp(75)], humidityLogs: [humidity(70)], now: NOW,
    });
    expect(result.dimensions.find((d) => d.id === 'uvb')?.score).toBeNull();
    expect(result.findings.some((f) => f.dimension === 'uvb')).toBe(false);
  });

  it('flags an expired bulb as critical', () => {
    const oldBulb = { ...enclosure, uvbBulbInstalledOn: daysAgo(600) } as Enclosure;
    const result = calculateHabitatScore({
      profile, enclosure: oldBulb, tempLogs: [temp(75)], humidityLogs: [humidity(70)], now: NOW,
    });
    expect(result.findings.find((f) => f.id === 'uvb-expiring')?.severity).toBe('critical');
  });
});

describe('calculateHabitatScore — size', () => {
  it('flags an undersized enclosure', () => {
    const result = calculateHabitatScore({
      profile, enclosure, tempLogs: [temp(75)], humidityLogs: [humidity(70)],
      dimensions: { width: 12, depth: 12, height: 12, units: 'in' },
      now: NOW,
    });
    const finding = result.findings.find((f) => f.id === 'size-undersized');
    expect(finding?.severity).toBe('critical');
    expect(finding?.fix).toContain('18');
  });

  it('accepts centimetre dimensions', () => {
    // 46x46x61cm ≈ 18x18x24in — just meets the minimum.
    const result = calculateHabitatScore({
      profile, enclosure, tempLogs: [temp(75)], humidityLogs: [humidity(70)],
      dimensions: { width: 46, depth: 46, height: 61, units: 'cm' },
      now: NOW,
    });
    expect(result.findings.some((f) => f.id === 'size-undersized')).toBe(false);
  });

  it('cannot assess size when dimensions were never recorded', () => {
    const result = calculateHabitatScore({
      profile, enclosure, tempLogs: [temp(75)], humidityLogs: [humidity(70)], now: NOW,
    });
    expect(result.dimensions.find((d) => d.id === 'size')?.score).toBeNull();
  });
});

describe('calculateHabitatScore — substrate', () => {
  it('flags a substrate that cannot hold required humidity', () => {
    const paper = { ...enclosure, substrateType: 'paper' } as Enclosure;
    const result = calculateHabitatScore({
      profile, enclosure: paper, tempLogs: [temp(75)], humidityLogs: [humidity(70)], now: NOW,
    });
    expect(result.findings.some((f) => f.id === 'substrate-mismatch')).toBe(true);
  });

  it('allows paper for a species with no humidity demand', () => {
    const aridSpecies = {
      ...profile,
      careTargets: { ...profile.careTargets, humidity: { ...profile.careTargets.humidity, day: { min: 30, max: 40 } } },
    } as AnimalProfile;
    const paper = { ...enclosure, substrateType: 'paper' } as Enclosure;
    const result = calculateHabitatScore({
      profile: aridSpecies, enclosure: paper,
      tempLogs: [temp(75)], humidityLogs: [humidity(35)], now: NOW,
    });
    expect(result.findings.some((f) => f.id === 'substrate-mismatch')).toBe(false);
  });
});

describe('calculateHabitatScore — honesty about missing data', () => {
  it('reports insufficientData when nothing meaningful can be judged', () => {
    const bare = { ...enclosure, uvbBulbInstalledOn: undefined, substrateType: undefined } as Enclosure;
    const noUvbSpecies = {
      ...profile,
      careTargets: { ...profile.careTargets, lighting: { ...profile.careTargets.lighting, uvbRequired: false } },
    } as AnimalProfile;

    const result = calculateHabitatScore({
      profile: noUvbSpecies, enclosure: bare, tempLogs: [], humidityLogs: [], now: NOW,
    });
    expect(result.insufficientData).toBe(true);
  });

  it('does not count unassessable dimensions against the score', () => {
    // No humidity logs at all — humidity must not read as 0.
    const result = calculateHabitatScore({
      profile, enclosure, tempLogs: [temp(75)], humidityLogs: [], now: NOW,
    });
    expect(result.dimensions.find((d) => d.id === 'humidity')?.score).toBeNull();
    expect(result.score).toBeGreaterThan(60);
  });

  it('raises a monitoring finding instead of silently passing', () => {
    const result = calculateHabitatScore({
      profile, enclosure, tempLogs: [], humidityLogs: [], now: NOW,
    });
    expect(result.findings.some((f) => f.id === 'monitoring-no-temp')).toBe(true);
    expect(result.findings.some((f) => f.id === 'monitoring-no-humidity')).toBe(true);
  });
});

describe('calculateHabitatScore — findings order', () => {
  it('puts the most severe finding first, and exposes it as topFinding', () => {
    const bad = { ...enclosure, uvbBulbInstalledOn: undefined } as Enclosure;
    const result = calculateHabitatScore({
      profile, enclosure: bad,
      tempLogs: [temp(75)],
      humidityLogs: [humidity(40)], // below target, but less severe than no UVB
      now: NOW,
    });
    expect(result.topFinding?.severity).toBe('critical');
    expect(result.findings[0].severity).toBe('critical');
  });
});
