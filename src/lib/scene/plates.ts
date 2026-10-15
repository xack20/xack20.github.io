// A case study as the home page's plate scene sees it. Pure: the page maps the content collection
// through toPlates and hands the result to the island.

/** The three kinds of work, in the order the legend lists them. */
export const CATEGORIES = ['agents', 'payments', 'personal'] as const;
export type Category = (typeof CATEGORIES)[number];

export type Mark = 'orbit' | 'bars' | 'graph';

/** Each category draws a figure of its own, so the three are told apart by shape, not by hue. */
export const MARKS: Readonly<Record<Category, Mark>> = { agents: 'orbit', payments: 'bars', personal: 'graph' };

export interface PlateData {
  readonly slug: string;
  /** "01".."11" */
  readonly number: string;
  readonly name: string;
  readonly org: string;
  readonly domain: string;
  readonly year: string;
  readonly status: string;
  readonly category: Category;
  readonly mark: Mark;
  readonly href: string;
}

/** The part of a `work` collection entry a plate is made from. */
export interface WorkEntry {
  readonly id: string;
  readonly data: {
    readonly card: string;
    /** "Organisation · Domain · Year" */
    readonly meta: string;
    readonly status: string;
    readonly order: number;
    readonly category: Category;
  };
}

export interface LegendEntry {
  readonly category: Category;
  readonly label: string;
  readonly count: number;
}

const META_SEPARATOR = ' · ';
const NUMBER_DIGITS = 2;
const WORK_PATH = '/work/';

const toPlate = ({ id, data }: WorkEntry): PlateData => {
  const [org = '', domain = '', year = ''] = data.meta.split(META_SEPARATOR);
  return {
    slug: id,
    number: String(data.order).padStart(NUMBER_DIGITS, '0'),
    name: data.card,
    org,
    domain,
    year,
    status: data.status,
    category: data.category,
    mark: MARKS[data.category],
    href: `${WORK_PATH}${id}/`,
  };
};

export const toPlates = (entries: readonly WorkEntry[]): readonly PlateData[] => [...entries].sort((a, b) => a.data.order - b.data.order).map(toPlate);

/** One line per category for the wall's legend: its label and how many plates carry it. */
export const legendOf = (plates: readonly Pick<PlateData, 'category'>[], labels: Readonly<Record<Category, string>>): readonly LegendEntry[] =>
  CATEGORIES.map((category) => ({ category, label: labels[category], count: plates.filter((plate) => plate.category === category).length }));
