import * as THREE from 'three'
import type { LonLatRing } from './countryLines'
import { lonLatToVector3 } from './globeMath'
import type { LonLatPoint } from './landPoints'

const globeColor = 0x67e8f9;
const lineRadiusOffset = 1.002;

export function createLandDots(points: LonLatPoint[], radius: number) {
  const positions = points.flatMap(([lon, lat]) => {
    const point = lonLatToVector3(lon, lat, radius);
    return [point.x, point.y, point.z];
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );

  const material = new THREE.PointsMaterial({
    color: globeColor,
    size: 0.003,
    transparent: true,
    opacity: 0.9
  });

  return new THREE.Points(geometry, material);
}

export function createCountryLines(rings: LonLatRing[], radius: number) {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: globeColor,
    transparent: true,
    opacity: 0.78
  });

  for (const ring of rings) {
    const points = ring.map(([lon, lat]) => (
      lonLatToVector3(lon, lat, radius * lineRadiusOffset)
    ));

    group.add(createLine(points, material));
  }

  return group;
}

export function createCoordinateGrid(radius: number) {
  const grid = new THREE.Group();
  const lineMaterial = new THREE.LineBasicMaterial({
    color: globeColor,
    transparent: true,
    opacity: 0.34
  });

  for (let lon = -180; lon < 180; lon += 30) {
    grid.add(createLongitudeLine(lon, radius, lineMaterial));
  }

  for (let lat = -75; lat <= 75; lat += 15) {
    grid.add(createLatitudeLine(lat, radius, lineMaterial));
  }

  return grid;
}

function createLongitudeLine(lon: number, radius: number, material: THREE.Material) {
  const points = [];

  for (let lat = -90; lat <= 90; lat += 2) {
    points.push(lonLatToVector3(lon, lat, radius * lineRadiusOffset));
  }

  return createLine(points, material);
}

function createLatitudeLine(lat: number, radius: number, material: THREE.Material) {
  const points = [];

  for (let lon = -180; lon <= 180; lon += 2) {
    points.push(lonLatToVector3(lon, lat, radius * lineRadiusOffset));
  }

  return createLine(points, material);
}

function createLine(points: THREE.Vector3[], material: THREE.Material) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, material);
}
