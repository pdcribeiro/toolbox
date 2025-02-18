import { getDragAndDropList } from '/components/DragAndDropList.js';
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
  let unsaved = {};

  const saveWithDebounce = debounce(save, DEBOUNCE_DELAY);

  return LifecycleManager({ onmount, onunmount },
    Name({ id, name, oninput }),
    Content({ content, oninput }),
    Pictures({ pictures }),
    Tags({ tags, oninput }),
  );

  async function save() {
    if (Object.keys(unsaved).length) {
      await db.updateNote(id, unsaved);
      unsaved = {};
    }
  }

  function oninput(inputData) {
    unsaved = { ...unsaved, ...inputData };
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

function Name({ name, oninput }) {
  return h1({ contenteditable: true, class: 'outline-none', oninput: (e) => oninput({ name: e.target.textContent }) }, name);
}

function Content({ content, ...props }) {
  const { list, addItem, removeItem } = getDragAndDropList(
    { class: 'mb-8', oninput, onupdate: oninput },
    content.map((text) => ContentItem({ text }))
  );

  return list;

  function oninput() {
    const newContent = Array.from(list.children).map((item) => item.textContent);
    props.oninput({ content: newContent });
  }
}

function ContentItem({ text }) {
  const headingMatch = text.match(/^(#+) \w/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const heading = van.tags[`h${level}`];
    const text = text.slice(level + 1);
    return heading({ contenteditable: true, class: 'outline-none' }, text);
  }
  return p({ contenteditable: true, class: 'whitespace-pre-wrap outline-none' }, text);
}

function Pictures({ pictures }) {
  return div({ class: 'overflow-x-auto whitespace-nowrap snap-x' },
    pictures.map((pic) => div({ class: 'inline-block w-full snap-center' },
      img({ src: pic.url, class: 'block mx-auto h-screen/2' }),
      p({ class: 'overflow-y-auto h-14 text-center whitespace-pre-wrap' }, pic.description),
    ))
  );
}

function Tags({ tags, oninput }) {
  return p({ contenteditable: true, class: 'outline-none', oninput: (e) => oninput({ tags: e.target.textContent }) }, tags);
}
