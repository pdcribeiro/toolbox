import kvstore from './kvstore.js';

const CONFIG_KEY = 'notes-config';
const DEFAULT_CONFIG = {
  appearance: {
    darkMode: false,
  },
  database: {
    authUrl: '',
    apiKey: '',
    baseUrl: '',
  },
};

export default {
  load() {
    return kvstore.get(CONFIG_KEY) ?? DEFAULT_CONFIG;
  },
  save(config) {
    kvstore.set(CONFIG_KEY, config);
  },
};
