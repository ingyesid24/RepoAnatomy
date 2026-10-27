import type { RepoAnatomyAPI } from '../electron/preload';

declare global {
  interface Window {
    repoanatomy: RepoAnatomyAPI;
  }
}

export {};
