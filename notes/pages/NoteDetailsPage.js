import LifecycleManager from '/components/LifecycleManager.js';
import { debounce } from '/lib/functions.js';
import { confirmAnd } from '/lib/utils.js';
import van from '/third-party/van.js';
import { routes } from '../app.js';
import db from '../db.js';

const DEBOUNCE_DELAY = 2000;

const { a, button, div, h1, p, img } = van.tags;

export default function NoteDetailsPage({ param: id }) {
  const note = van.state(null);
  db.getNote(id).then((data) => (note.val = data));

  return div(
    Header({ id }),
    () => note.val ? NoteDetails(note.val) : p('loading note data...'),
  );
}

function Header({ id }) {
  return div({ class: 'flex sticky top-0 items-center bg-theme' },
    a({ href: routes.noteList.getPath(), class: 'button small' }, '< note list'),
    a({ href: routes.noteEdit.getPath(id), class: 'button small ml-auto' }, 'edit'),
    button({ onclick: confirmAndDelete, class: 'button small ml-4' }, 'delete'),
  );

  function confirmAndDelete() {
    confirmAnd(() => db.deleteNote(id).then(routes.noteList.visit));
  }
}

function NoteDetails({ id, name, content, pictures, tags }) {
  return div(
    Name({ id, name }),
    Content({ content }),
    Pictures({ pictures }),
    p(tags)
  );
}

function Name({ id, name }) {
  let unsaved = false;

  const saveWithDebounce = debounce(save, DEBOUNCE_DELAY);

  const element = h1({ contenteditable: true, class: 'outline-none', oninput }, name);

  return LifecycleManager({ onmount, onunmount }, element);

  async function save() {
    if (unsaved) {
      await db.updateNote(id, { name: element.textContent });
      unsaved = false;
    }
  }

  function oninput() {
    unsaved = true;
    saveWithDebounce();
  }

  function onmount() {
    document.addEventListener('visibilitychange', saveOnHide);
  }

  function saveOnHide() {
    if (document.hidden) {
      save();
    }
  }

  async function onunmount() {
    await save();
    document.removeEventListener('visibilitychange', saveOnHide);
  }
}

function Content({ content }) {
  return div({ class: 'mb-8' },
    content.map((line) => {
      if (!line.trim().length) {
        return null; // ignore empty lines
      }
      const headingMatch = line.match(/^(#+) \w/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const heading = van.tags[`h${level}`];
        const text = line.slice(level + 1);
        return heading(text);
      }
      return p({ class: 'whitespace-pre-wrap' }, line);
    })
  );
}

function Pictures({ pictures }) {
  return div({ class: 'overflow-x-auto text-nowrap snap-x' },
    pictures.map((pic) => div({ class: 'inline-block w-full snap-center' },
      img({ src: pic.url, class: 'block mx-auto h-screen/2' }),
      p({ class: 'overflow-y-auto h-14 text-center whitespace-pre-wrap' }, pic.description),
    ))
  );
}
