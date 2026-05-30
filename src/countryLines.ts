import type { LonLatPoint } from './landPoints'

export type LonLatRing = LonLatPoint[];

type CountryLinesData = {
  rings: LonLatRing[];
};

export async function loadCountryLines() {
  const response = await fetch('/country-lines.json');

  if (!response.ok) {
    throw new Error(
      'Could not load /country-lines.json. Run `npm run prepare:country-lines` first.'
    );
  }

  const data = (await response.json()) as CountryLinesData;
  return data.rings;
}
