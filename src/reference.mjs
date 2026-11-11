/** Aggregate observations only; the full provenance lives outside the runtime package. */
export const PROFILE_REFERENCE = Object.freeze({
  id: 'public-contributors-2026-11-11', observedAt: '2026-11-11T12:31:41.214Z',
  sampleSize: 100, projectCount: 12, completeRunRequests: 32,
  observations: { withBio: 58, withWebsite: 56, withPins: 72, medianPins: 4,
    rootReadmesObserved: 17, readmeWords: { p25: 18, median: 50, p75: 147 },
    readmesWithoutImages: 11, readmesWithStatCards: 4, readmesWithLinks: 13 },
  source: 'https://github.com/ibbuilds/gh-aura/blob/main/research/profiles.json',
  sourceBlob: 'f7b2f0c3812be42e9fa40928c4100cd8c5e1fe8d',
  limitations: 'Purposive open-source contributor sample. Not a hiring-outcome study, representative survey or verification of employment. Root README.md detection only. No borrowed biography text.',
});
