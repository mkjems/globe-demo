import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const sourceUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const outputPath = resolve('public/country-lines.json');
const sampleEveryDegrees = 0.35;
const antimeridianThresholdDegrees = 180;
const minRingPoints = 2;

function transformPoint(topology, point) {
  const [scaleX, scaleY] = topology.transform.scale;
  const [translateX, translateY] = topology.transform.translate;

  return [
    point[0] * scaleX + translateX,
    point[1] * scaleY + translateY
  ];
}

function decodeArc(topology, arcIndex) {
  const arc = topology.arcs[arcIndex < 0 ? ~arcIndex : arcIndex];
  const coordinates = [];
  let x = 0;
  let y = 0;

  for (const [dx, dy] of arc) {
    x += dx;
    y += dy;
    coordinates.push(transformPoint(topology, [x, y]));
  }

  return arcIndex < 0 ? coordinates.reverse() : coordinates;
}

function distanceDegrees([lonA, latA], [lonB, latB]) {
  const wrappedLonDelta = Math.abs(lonA - lonB);
  const lonDelta = Math.min(wrappedLonDelta, 360 - wrappedLonDelta);
  const latDelta = Math.abs(latA - latB);

  return Math.hypot(lonDelta, latDelta);
}

function crossesAntimeridian(start, end) {
  return Math.abs(start[0] - end[0]) > antimeridianThresholdDegrees;
}

function sampleSegment(start, end) {
  const distance = distanceDegrees(start, end);
  const stepCount = Math.max(1, Math.ceil(distance / sampleEveryDegrees));
  const points = [];

  for (let i = 0; i < stepCount; i++) {
    const amount = i / stepCount;
    points.push([
      start[0] + (end[0] - start[0]) * amount,
      start[1] + (end[1] - start[1]) * amount
    ]);
  }

  return points;
}

function pushRing(rings, ring) {
  if (ring.length >= minRingPoints) {
    rings.push(ring);
  }
}

function sampleRing(coordinates) {
  const rings = [];
  let currentRing = [];

  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = coordinates[i];
    const end = coordinates[i + 1];

    if (crossesAntimeridian(start, end)) {
      currentRing.push(start);
      pushRing(rings, currentRing);
      currentRing = [end];
      continue;
    }

    currentRing.push(...sampleSegment(start, end));
  }

  if (coordinates.length > 0) {
    currentRing.push(coordinates.at(-1));
  }

  pushRing(rings, currentRing);
  return rings;
}

function collectRings(geometry) {
  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.flatMap(collectRings);
  }

  if (geometry.type === 'Polygon') {
    return geometry.arcs;
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.arcs.flatMap((polygon) => polygon);
  }

  return [];
}

async function main() {
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(`Failed to download ${sourceUrl}: ${response.status} ${response.statusText}`);
  }

  const topology = await response.json();
  const countries = topology.objects.countries;
  const allRings = [];

  for (const ring of collectRings(countries)) {
    const coordinates = ring.flatMap((arcIndex) => decodeArc(topology, arcIndex));
    allRings.push(...sampleRing(coordinates));
  }

  const pointCount = allRings.reduce((total, ring) => total + ring.length, 0);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        source: sourceUrl,
        sampleEveryDegrees,
        ringCount: allRings.length,
        pointCount,
        rings: allRings
      },
      null,
      2
    )}\n`
  );

  console.log(`Wrote ${allRings.length} country outline rings to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
