import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const naturalEarthResolution = '10m';
const sourceUrl = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_${naturalEarthResolution}_coastline.geojson`;
const outputPath = resolve('public/natural-earth-lines.json');
const sampleEveryDegrees = 0.35;
const antimeridianThresholdDegrees = 180;
const coordinatePrecision = 4;

function roundCoordinate(value) {
  return Number(value.toFixed(coordinatePrecision));
}

function distanceDegrees([lonA, latA], [lonB, latB]) {
  const wrappedLonDelta = Math.abs(lonA - lonB);
  const lonDelta = Math.min(wrappedLonDelta, 360 - wrappedLonDelta);
  const latDelta = Math.abs(latA - latB);

  return Math.hypot(lonDelta, latDelta);
}

function sampleSegment(start, end) {
  const distance = distanceDegrees(start, end);
  const stepCount = Math.max(1, Math.ceil(distance / sampleEveryDegrees));
  const points = [];

  for (let i = 0; i < stepCount; i++) {
    const amount = i / stepCount;
    points.push([
      roundCoordinate(start[0] + (end[0] - start[0]) * amount),
      roundCoordinate(start[1] + (end[1] - start[1]) * amount)
    ]);
  }

  return points;
}

function pushRing(rings, ring) {
  if (ring.length >= 2) {
    rings.push(ring);
  }
}

function sampleLine(coordinates) {
  const rings = [];
  let currentRing = [];

  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = coordinates[i];
    const end = coordinates[i + 1];

    if (Math.abs(start[0] - end[0]) > antimeridianThresholdDegrees) {
      currentRing.push([
        roundCoordinate(start[0]),
        roundCoordinate(start[1])
      ]);
      pushRing(rings, currentRing);
      currentRing = [[
        roundCoordinate(end[0]),
        roundCoordinate(end[1])
      ]];
      continue;
    }

    currentRing.push(...sampleSegment(start, end));
  }

  if (coordinates.length > 0) {
    const [lon, lat] = coordinates.at(-1);
    currentRing.push([roundCoordinate(lon), roundCoordinate(lat)]);
  }

  pushRing(rings, currentRing);
  return rings;
}

function collectLineStrings(geometry) {
  if (geometry.type === 'LineString') {
    return [geometry.coordinates];
  }

  if (geometry.type === 'MultiLineString') {
    return geometry.coordinates;
  }

  return [];
}

async function main() {
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(`Failed to download ${sourceUrl}: ${response.status} ${response.statusText}`);
  }

  const geojson = await response.json();
  const rings = [];

  for (const feature of geojson.features) {
    for (const line of collectLineStrings(feature.geometry)) {
      rings.push(...sampleLine(line));
    }
  }

  const pointCount = rings.reduce((total, ring) => total + ring.length, 0);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        source: sourceUrl,
        naturalEarthResolution,
        sampleEveryDegrees,
        coordinatePrecision,
        ringCount: rings.length,
        pointCount,
        rings
      },
      null,
      2
    )}\n`
  );

  console.log(`Wrote ${rings.length} Natural Earth coastline rings to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
