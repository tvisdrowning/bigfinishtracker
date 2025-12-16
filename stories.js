// Fallback catalogue used when the metadata provider is unavailable.
const fallbackReleases = [
  {
    id: 'MR-047',
    title: 'The Mutant Phase',
    doctor: 'Fifth Doctor',
    series: 'Main Range',
    subSeries: 'Dalek Empire',
    year: 2000,
    stories: [
      { id: 'MR-047-1', title: 'Part One' },
      { id: 'MR-047-2', title: 'Part Two' },
      { id: 'MR-047-3', title: 'Part Three' },
      { id: 'MR-047-4', title: 'Part Four' }
    ]
  },
  {
    id: 'FD-1.1',
    title: 'Destination Nerva',
    doctor: 'Fourth Doctor',
    series: 'Fourth Doctor Adventures',
    subSeries: 'Series 1',
    year: 2012,
    stories: [{ id: 'FD-1.1-1', title: 'Destination Nerva' }]
  },
  {
    id: 'FD-1.2',
    title: 'The Renaissance Man',
    doctor: 'Fourth Doctor',
    series: 'Fourth Doctor Adventures',
    subSeries: 'Series 1',
    year: 2012,
    stories: [{ id: 'FD-1.2-1', title: 'The Renaissance Man' }]
  },
  {
    id: 'MR-100',
    title: '100',
    doctor: 'Sixth Doctor',
    series: 'Main Range',
    subSeries: 'Special',
    year: 2007,
    stories: [
      { id: 'MR-100-1', title: '100 BC' },
      { id: 'MR-100-2', title: 'My Own Private Wolfgang' },
      { id: 'MR-100-3', title: 'Bedtime Story' },
      { id: 'MR-100-4', title: 'The 100 Days of the Doctor' }
    ]
  },
  {
    id: 'MR-200',
    title: 'The Secret History',
    doctor: 'Fifth Doctor',
    series: 'Main Range',
    subSeries: 'Trilogy',
    year: 2015,
    stories: [{ id: 'MR-200-1', title: 'The Secret History' }]
  },
  {
    id: 'MR-275',
    title: "Blood on Santa's Claw and Other Stories",
    doctor: 'Seventh Doctor',
    series: 'Main Range',
    subSeries: 'Christmas Special',
    year: 2019,
    stories: [
      { id: 'MR-275-1', title: "Blood on Santa's Claw" },
      { id: 'MR-275-2', title: 'The Baby Awakes' },
      { id: 'MR-275-3', title: 'I Wish It Could Be Christmas Every Day' },
      { id: 'MR-275-4', title: 'Brightly Shone the Moon That Night' }
    ]
  },
  {
    id: 'DB-1',
    title: 'Technophobia',
    doctor: 'Tenth Doctor',
    series: 'The Tenth Doctor Adventures',
    subSeries: 'Volume 1',
    year: 2016,
    stories: [{ id: 'DB-1-1', title: 'Technophobia' }]
  },
  {
    id: 'DB-2',
    title: 'Time Reaver',
    doctor: 'Tenth Doctor',
    series: 'The Tenth Doctor Adventures',
    subSeries: 'Volume 1',
    year: 2016,
    stories: [{ id: 'DB-2-1', title: 'Time Reaver' }]
  },
  {
    id: 'TLV-1',
    title: 'Echoes',
    doctor: 'Eighth Doctor',
    series: 'Time Lord Victorious',
    subSeries: 'Echoes of Extinction',
    year: 2020,
    stories: [
      { id: 'TLV-1-1', title: 'The Enemy Beyond' },
      { id: 'TLV-1-2', title: 'The Hollow' }
    ]
  },
  {
    id: 'CC-1',
    title: 'The Price of Paradise',
    doctor: 'Third Doctor',
    series: 'Companion Chronicles',
    subSeries: 'Season 11',
    year: 2007,
    stories: [{ id: 'CC-1-1', title: 'The Price of Paradise' }]
  }
];

const fallbackStories = fallbackReleases.flatMap((release) =>
  release.stories.map((story) => ({ ...story, releaseId: release.id, doctor: release.doctor, series: release.series }))
);

if (typeof module !== 'undefined') {
  module.exports = { fallbackReleases, fallbackStories };
}
