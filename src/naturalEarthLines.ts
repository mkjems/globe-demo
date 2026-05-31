import type { LonLatRing } from './countryLines'

type NaturalEarthLinesData = {
  rings: LonLatRing[];
};

export async function loadNaturalEarthLines() {
  const response = await fetch('/natural-earth-lines.json');

  if (!response.ok) {
    throw new Error(
      'Could not load /natural-earth-lines.json. Run `npm run prepare:natural-earth-lines` first.'
    );
  }

  const data = (await response.json()) as NaturalEarthLinesData;
  return data.rings;
}
