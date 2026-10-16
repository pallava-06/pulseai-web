import { INITIAL_STORIES } from '../data/initialStories.js';

const STORIES_KEY = 'pulseai_stories_v1';
const SAVED_KEY = 'pulseai_saved_v1';
const GEMINI_KEY = 'pulseai_gemini_key';

export function loadAppState() {
  let stories = [...INITIAL_STORIES];
  let savedIds = new Set();
  let geminiApiKey = '';

  try {
    const storedStories = localStorage.getItem(STORIES_KEY);
    if (storedStories) {
      stories = JSON.parse(storedStories);
    }
    const storedSaved = localStorage.getItem(SAVED_KEY);
    if (storedSaved) {
      savedIds = new Set(JSON.parse(storedSaved));
    }
    const storedKey = localStorage.getItem(GEMINI_KEY);
    if (storedKey) {
      geminiApiKey = storedKey;
    }
  } catch (e) {
    stories = [...INITIAL_STORIES];
  }

  return { stories, savedIds, geminiApiKey };
}

export function persistAppState(stories, savedIds) {
  try {
    localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
    localStorage.setItem(SAVED_KEY, JSON.stringify([...savedIds]));
  } catch (e) {
    // Ignore storage quota or sandbox restrictions
  }
}

export function persistApiKey(apiKey) {
  try {
    localStorage.setItem(GEMINI_KEY, apiKey);
  } catch (e) {
    // Ignore storage quota or sandbox restrictions
  }
}
