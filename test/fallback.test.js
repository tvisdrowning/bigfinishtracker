const assert = require('assert');
const { describe, it } = require('node:test');
const { fallbackReleases, fallbackStories } = require('../stories');

describe('fallback catalogue data', () => {
  it('exposes at least one release and one story', () => {
    assert.ok(Array.isArray(fallbackReleases));
    assert.ok(Array.isArray(fallbackStories));
    assert.ok(fallbackReleases.length > 0, 'expected releases');
    assert.ok(fallbackStories.length > 0, 'expected stories');
  });

  it('ensures every story has an id, title, doctor, and release reference', () => {
    for (const story of fallbackStories) {
      assert.ok(story.id, 'story id');
      assert.ok(story.title, 'story title');
      assert.ok(story.releaseId, 'release id');
      assert.ok(story.doctor, 'story doctor');
    }
  });

  it('ensures every release has an id, title, doctor, and at least one story', () => {
    for (const release of fallbackReleases) {
      assert.ok(release.id, 'release id');
      assert.ok(release.title, 'release title');
      assert.ok(release.doctor, 'release doctor');
      assert.ok(Array.isArray(release.stories), 'release stories');
      assert.ok(release.stories.length > 0, 'has stories');
    }
  });
});
