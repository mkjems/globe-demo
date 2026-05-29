export type LonLatPoint = [number, number];

type LandPointsData = {
  points: LonLatPoint[];
};

export async function loadLandPoints() {
  const response = await fetch('/land-points.json');

  if (!response.ok) {
    throw new Error(
      'Could not load /land-points.json. Run `npm run prepare:land` first.'
    );
  }

  const data = (await response.json()) as LandPointsData;
  return data.points;
}
