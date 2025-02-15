import kvstore from './kvstore.js';

const CONFIG_KEY = 'notes-database-config';
const COLLECTION_KEY = 'notes-database-collection';

const db = {
  async findNotes() {
    return get();
  },
  async createNote(data) {
    const notes = get();
    const note = { id: getNextId(), ...data };
    notes.push(note);
    set(notes);
    console.debug('[dev db] note created', note);
    return note;
  },
  async getNote(id) {
    const note = get().find((s) => s.id === id);
    if (!note) {
      throw new Error('note not found');
    }
    console.debug('[dev db] note found', note);
    return note;
  },
  async updateNote(id, data) {
    const notes = get();
    const index = notes.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('note not found');
    }
    const note = { ...notes[index], ...data };
    notes[index] = note;
    set(notes);
    console.debug('[dev db] note updated', note);
    return note;
  },
  async deleteNote(id) {
    const notes = get();
    const index = notes.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('note not found');
    }
    const note = notes[index];
    notes.splice(index, 1);
    set(notes);
    console.debug('[dev db] note deleted', note);
  },
};

window.migrateDb = function (callback) {
  const notes = get();
  const migrated = callback(notes);
  set(migrated);
};

function get() {
  return kvstore.get(COLLECTION_KEY) ?? [];
}

function set(notes) {
  kvstore.set(COLLECTION_KEY, notes);
}

function getNextId() {
  const config = kvstore.get(CONFIG_KEY) ?? {};
  if (!config.nextId) {
    config.nextId = 1;
  } else {
    config.nextId += 1;
  }
  kvstore.set(CONFIG_KEY, config);
  return config.nextId;
}

export default db;


// MIGRATIONS

// migrateDb(notes => notes.map(s => ({...s, pictures: s.pictures.map(pic => ({...pic, description: pic.description ?? ''}))})))


// SEEDS

// await db.createNote({ name: 'effleurage', description: 'lorem ipsum', images: [], tags: [] });

// import seeds from './seeds.json'
// localStorage.setItem(CONFIG_KEY, seeds.config)
// localStorage.setItem(COLLECTION_KEY, seeds.notes)
