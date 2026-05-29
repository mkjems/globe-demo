import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const sourceUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json';
const outputPath = resolve('public/land-points.json');
const sampleEveryDegrees = 0.45;

function transformPoint(topology, point) {
  const [scaleX, scaleY] = topology.transform.scale;
  const [translateX, translateY] = topology.transform.translate;

  return [
    point[0] * scaleX + translateX,
    point[1] * scaleY + translateY
  ];
}

function decodeArc(topology, arcIndex) {
  const arc = topology.arcs[Math.abs(arcIndex)];
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

function sampleRing(ring) {
  const points = [];

  for (let i = 0; i < ring.length - 1; i++) {
    points.push(...sampleSegment(ring[i], ring[i + 1]));
  }

  return points;
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
  const land = topology.objects.land;
  const allPoints = [];

  for (const ring of collectRings(land)) {
    const coordinates = ring.flatMap((arcIndex) => decodeArc(topology, arcIndex));
    allPoints.push(...sampleRing(coordinates));
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        source: sourceUrl,
        sampleEveryDegrees,
        pointCount: allPoints.length,
        points: allPoints
      },
      null,
      2
    )}\n`
  );

  console.log(`Wrote ${allPoints.length} land outline points to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
