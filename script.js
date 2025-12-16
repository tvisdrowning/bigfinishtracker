const storageKey = 'bft-progress-v1';
const providerBase = 'https://provider.vito0912.de/bigfinish';
const providerAuth = 'Basic ' + btoa('abs:');
const defaultQuery = 'doctor';
const dbName = 'bft-catalogue';
const dbVersion = 1;
const releaseStoreName = 'releases';
const storyStoreName = 'stories';

const docFilter = document.getElementById('doctor-filter');
const seriesFilter = document.getElementById('series-filter');
const subSeriesFilter = document.getElementById('subseries-filter');
const searchFilter = document.getElementById('search-filter');
const releaseList = document.getElementById('release-list');
const releaseCount = document.getElementById('release-count');
const providerStatus = document.getElementById('provider-status');
const syncButton = document.getElementById('sync-provider');

const overallPercentEl = document.getElementById('overall-percent');
const overallBarEl = document.getElementById('overall-bar');
const overallCountEl = document.getElementById('overall-count');

const doctorProgressList = document.getElementById('doctor-progress-list');
const seriesProgressList = document.getElementById('series-progress-list');

let releases = [];
let allStories = [];
let progress = loadProgress();
let filtersInitialized = false;
let dbPromise;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(releaseStoreName)) {
        db.createObjectStore(releaseStoreName, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(storyStoreName)) {
        const storyStore = db.createObjectStore(storyStoreName, { keyPath: 'id' });
        storyStore.createIndex('byRelease', 'releaseId');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getDb() {
  if (!dbPromise) {
    dbPromise = openDatabase();
  }
  return dbPromise;
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function cacheCatalogue(releasesToCache) {
  try {
    const db = await getDb();
    const tx = db.transaction([releaseStoreName, storyStoreName], 'readwrite');
    const releaseStore = tx.objectStore(releaseStoreName);
    const storyStore = tx.objectStore(storyStoreName);

    releaseStore.clear();
    storyStore.clear();

    releasesToCache.forEach((release) => {
      const { stories, ...releaseData } = release;
      releaseStore.put(releaseData);
      stories.forEach((story) => {
        storyStore.put({
          ...story,
          releaseId: release.id,
          doctor: release.doctor,
          series: release.series
        });
      });
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('Unable to cache catalogue in IndexedDB', error);
  }
}

async function loadCatalogueFromDb() {
  try {
    const db = await getDb();
    const tx = db.transaction([releaseStoreName, storyStoreName], 'readonly');
    const releaseStore = tx.objectStore(releaseStoreName);
    const storyStore = tx.objectStore(storyStoreName);

    const [storedReleases, storedStories] = await Promise.all([
      requestToPromise(releaseStore.getAll()),
      requestToPromise(storyStore.getAll())
    ]);

    const storiesByRelease = storedStories.reduce((acc, story) => {
      acc[story.releaseId] = acc[story.releaseId] || [];
      acc[story.releaseId].push(story);
      return acc;
    }, {});

    return storedReleases.map((release) => ({
      ...release,
      stories: storiesByRelease[release.id] || []
    }));
  } catch (error) {
    console.warn('Unable to read catalogue from IndexedDB', error);
    return [];
  }
}

function loadProgress() {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Unable to load progress from storage', error);
    return {};
  }
}

function saveProgress() {
  localStorage.setItem(storageKey, JSON.stringify(progress));
}

function initFilters() {
  setOptions(docFilter, ['All Doctors', ...uniqueValues(releases, 'doctor')]);
  setOptions(seriesFilter, ['All Series', ...uniqueValues(releases, 'series')]);
  setOptions(subSeriesFilter, ['All Sub-series', ...uniqueValues(releases, 'subSeries')]);

  if (!filtersInitialized) {
    [docFilter, seriesFilter, subSeriesFilter, searchFilter].forEach((filter) => {
      filter.addEventListener('input', render);
    });
    filtersInitialized = true;
  }
}

function setOptions(select, items) {
  select.innerHTML = '';
  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.startsWith('All') ? 'all' : item;
    option.textContent = item;
    select.append(option);
  });
}

function uniqueValues(list, key) {
  return Array.from(new Set(list.map((item) => item[key]).filter(Boolean))).sort();
}

function getFilters() {
  return {
    doctor: docFilter.value !== 'all' ? docFilter.value : null,
    series: seriesFilter.value !== 'all' ? seriesFilter.value : null,
    subSeries: subSeriesFilter.value !== 'all' ? subSeriesFilter.value : null,
    search: searchFilter.value.trim().toLowerCase()
  };
}

function filterReleases() {
  const filters = getFilters();

  return releases.filter((release) => {
    const matchesDoctor = !filters.doctor || release.doctor === filters.doctor;
    const matchesSeries = !filters.series || release.series === filters.series;
    const matchesSub = !filters.subSeries || release.subSeries === filters.subSeries;
    const searchHit = filters.search
      ? release.title.toLowerCase().includes(filters.search) ||
        release.stories.some((story) => story.title.toLowerCase().includes(filters.search))
      : true;
    return matchesDoctor && matchesSeries && matchesSub && searchHit;
  });
}

function renderRelease(release) {
  const template = document.getElementById('release-template').content.cloneNode(true);
  const eyebrow = template.querySelector('.eyebrow');
  const title = template.querySelector('.release-title');
  const meta = template.querySelector('.meta');
  const storyList = template.querySelector('.story-list');
  const releaseCheckbox = template.querySelector('.release-checkbox');
  const cover = template.querySelector('.cover');
  const description = template.querySelector('.release-description');
  const stats = template.querySelector('.release-stats');

  eyebrow.textContent = `${release.doctor || 'Doctor Unknown'} · ${release.series || 'Series unknown'}`;
  title.textContent = release.title;
  meta.textContent = `${release.subSeries || 'No sub-series noted'} • ${release.year || 'Unknown year'}`;

  if (release.cover) {
    cover.src = release.cover;
    cover.alt = `${release.title} cover art`;
  } else {
    cover.remove();
  }

  description.textContent = release.description || 'No description available yet.';
  stats.textContent = buildStatLine(release);

  const listenedStories = release.stories.filter((story) => progress[story.id]);
  releaseCheckbox.checked = listenedStories.length === release.stories.length;
  releaseCheckbox.indeterminate = listenedStories.length > 0 && listenedStories.length < release.stories.length;

  releaseCheckbox.addEventListener('change', () => {
    release.stories.forEach((story) => {
      progress[story.id] = releaseCheckbox.checked;
    });
    saveProgress();
    render();
  });

  release.stories.forEach((story) => {
    const li = document.createElement('li');
    li.className = 'story';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(progress[story.id]);
    checkbox.addEventListener('change', () => {
      progress[story.id] = checkbox.checked;
      saveProgress();
      render();
    });

    const title = document.createElement('div');
    title.className = 'story-title';
    title.textContent = story.title;

    li.append(checkbox, title);
    storyList.append(li);
  });

  return template;
}

function buildStatLine(release) {
  const parts = [];
  if (release.durationMinutes) parts.push(`${release.durationMinutes} min`);
  if (release.publisher) parts.push(release.publisher);
  if (release.isbn) parts.push(`ISBN ${release.isbn}`);
  return parts.join(' • ');
}

function renderProgressBars(groupedCounts, container) {
  container.innerHTML = '';
  const template = document.getElementById('progress-row-template');

  groupedCounts.forEach(({ label, listened, total }) => {
    const node = template.content.cloneNode(true);
    const percentage = total === 0 ? 0 : Math.round((listened / total) * 100);
    node.querySelector('.label').textContent = label;
    node.querySelector('.bar span').style.width = `${percentage}%`;
    node.querySelector('.value').textContent = `${percentage}% (${listened}/${total})`;
    container.append(node);
  });
}

function calculateProgress() {
  const totalStories = allStories.length;
  const listenedStories = allStories.filter((story) => progress[story.id]).length;
  const overallPercent = totalStories === 0 ? 0 : Math.round((listenedStories / totalStories) * 100);

  const doctorCounts = uniqueValues(releases, 'doctor').map((doctor) => {
    const doctorStories = allStories.filter((story) => story.doctor === doctor);
    const listened = doctorStories.filter((story) => progress[story.id]).length;
    return { label: doctor, listened, total: doctorStories.length };
  });

  const seriesCounts = uniqueValues(releases, 'series').map((series) => {
    const seriesStories = allStories.filter((story) => story.series === series);
    const listened = seriesStories.filter((story) => progress[story.id]).length;
    return { label: series, listened, total: seriesStories.length };
  });

  return { totalStories, listenedStories, overallPercent, doctorCounts, seriesCounts };
}

function renderProgress() {
  const { totalStories, listenedStories, overallPercent, doctorCounts, seriesCounts } = calculateProgress();

  overallPercentEl.textContent = `${overallPercent}%`;
  overallBarEl.style.width = `${overallPercent}%`;
  overallCountEl.textContent = `${listenedStories} of ${totalStories} stories completed`;

  renderProgressBars(doctorCounts, doctorProgressList);
  renderProgressBars(seriesCounts, seriesProgressList);
}

function render() {
  const filtered = filterReleases();
  releaseList.innerHTML = '';
  releaseCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'result' : 'results'}`;
  filtered.forEach((release) => releaseList.append(renderRelease(release)));
  renderProgress();
}

function detectDoctor(sourceText = '') {
  const lookup = [
    'First Doctor',
    'Second Doctor',
    'Third Doctor',
    'Fourth Doctor',
    'Fifth Doctor',
    'Sixth Doctor',
    'Seventh Doctor',
    'Eighth Doctor',
    'Ninth Doctor',
    'Tenth Doctor',
    'Eleventh Doctor',
    'Twelfth Doctor',
    'Thirteenth Doctor',
    'Fourteenth Doctor',
    'Fifteenth Doctor'
  ];

  const normalized = sourceText.toLowerCase();
  const match = lookup.find((doctor) => normalized.includes(doctor.toLowerCase()));
  return match || 'Doctor Unknown';
}

function mapProviderResult(result) {
  const seriesInfo = Array.isArray(result.series) ? result.series[0] : result.series;
  const doctor = detectDoctor(`${result.title || ''} ${seriesInfo?.series || ''}`);
  const sequence = seriesInfo?.sequence || seriesInfo?.sequence === 0 ? seriesInfo.sequence : null;
  const year = result.publishedYear || null;
  const durationMinutes = result.duration ? Math.round(result.duration / 60) : null;
  const id = result.isbn || `${(seriesInfo?.series || 'BF').replace(/\s+/g, '-')}-${result.title || 'Unknown'}`;

  return {
    id,
    title: result.title || 'Untitled release',
    doctor,
    series: seriesInfo?.series || 'Unknown series',
    subSeries: sequence || 'Unsequenced',
    year,
    cover: result.cover || null,
    description: result.description || null,
    durationMinutes,
    publisher: result.publisher || 'Big Finish',
    isbn: result.isbn || null,
    stories: [
      {
        id: `${id}-story`,
        title: result.title || 'Story',
        releaseId: id,
        doctor,
        series: seriesInfo?.series || 'Unknown series'
      }
    ]
  };
}

async function fetchFromProvider(query) {
  const params = new URLSearchParams({ title: query || defaultQuery });
  const url = `${providerBase}/limit:10/search?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      Authorization: providerAuth
    }
  });

  if (!response.ok) {
    throw new Error(`Provider error: ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Unexpected provider payload');
  }

  return data.map(mapProviderResult);
}

function updateStoryCache() {
  allStories = releases.flatMap((release) =>
    release.stories.map((story) => ({ ...story, releaseId: release.id, doctor: release.doctor, series: release.series }))
  );
}

async function useCatalogue(data, statusMessage) {
  releases = data;
  updateStoryCache();
  initFilters();
  render();
  if (statusMessage) setStatus(statusMessage);
}

async function loadCatalogue(query = defaultQuery) {
  setStatus(`Contacting metadata provider for "${query}" …`);
  try {
    const providerResults = await fetchFromProvider(query);
    await useCatalogue(providerResults, `Loaded ${providerResults.length} releases from abs-agg Big Finish provider.`);
    await cacheCatalogue(providerResults);
  } catch (error) {
    console.warn('Provider failed, falling back to cached data', error);
    const cached = await loadCatalogueFromDb();
    if (cached.length) {
      await useCatalogue(cached, 'Metadata provider unavailable. Showing cached catalogue from IndexedDB.');
    } else {
      await useCatalogue(fallbackReleases, 'Metadata provider unavailable. Showing bundled fallback catalogue.');
      await cacheCatalogue(fallbackReleases);
    }
  }
}

function setStatus(message) {
  providerStatus.textContent = message;
}

async function loadInitialCatalogue() {
  const cached = await loadCatalogueFromDb();
  if (cached.length) {
    await useCatalogue(cached, `Loaded ${cached.length} releases from local database cache.`);
  } else {
    await useCatalogue(fallbackReleases, 'Loaded bundled fallback catalogue.');
    await cacheCatalogue(fallbackReleases);
  }
}

async function init() {
  syncButton.addEventListener('click', () => {
    const query = searchFilter.value.trim() || defaultQuery;
    loadCatalogue(query);
  });

  await loadInitialCatalogue();
  loadCatalogue();
}

init();
