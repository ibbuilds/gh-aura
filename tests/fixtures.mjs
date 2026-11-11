import { DEFAULT_CONFIG } from '../src/config.mjs';

export function configForTest() {
  return structuredClone(DEFAULT_CONFIG);
}

export function snapshotForTest() {
  return {
    username: 'example',
    observedAt: '2026-11-11T00:00:00.000Z',
    user: {
      login: 'example',
      name: 'Example Developer',
      bio: 'Builds useful tools and libraries.',
      blog: 'https://example.dev',
      public_repos: 3,
    },
    profileReadme: null,
    truncated: false,
    repos: [
      {
        name: 'backend-toolkit',
        full_name: 'example/backend-toolkit',
        description: 'Node.js APIs and developer tooling',
        language: 'JavaScript',
        topics: ['nodejs', 'backend', 'api'],
        homepage: 'https://example.dev/toolkit',
        fork: false,
        archived: false,
        private: false,
        size: 500,
        pushed_at: '2026-10-30T00:00:00Z',
        stargazers_count: 0,
      },
      {
        name: 'old-popular-fork',
        full_name: 'example/old-popular-fork',
        description: 'Fork of a popular library',
        language: 'JavaScript',
        topics: [],
        homepage: '',
        fork: true,
        archived: true,
        private: false,
        size: 50,
        pushed_at: '2019-01-01T00:00:00Z',
        stargazers_count: 600,
      },
      {
        name: 'quiet-scripting',
        full_name: 'example/quiet-scripting',
        description: '',
        language: 'Python',
        topics: [],
        homepage: '',
        fork: false,
        archived: false,
        private: false,
        size: 2,
        pushed_at: '2026-09-15T00:00:00Z',
        stargazers_count: 0,
      },
    ],
  };
}
