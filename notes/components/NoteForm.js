import { getLocalFileUrl } from '/lib/files.js';
import van from '/third-party/van.js';
import DragAndDropList from '/components/DragAndDropList.js';
import Modal from '/components/Modal.js';
import { bind, confirmAnd } from '/lib/utils.js';

const { button, div, input, label, textarea, img } = van.tags;

export default function NoteForm({ initialData = {}, onsubmit, oncancel }) {
  const { pictures: initialPictures = [], ...initialTextData } = initialData;

  const textData = van.state({
    name: '',
    content: '',
    tags: '',
    ...initialTextData,
  });
  const pictures = van.state(initialPictures);

  return div(
    label('name'), input(bind(textData, 'name')),
    label('content'), textarea({ rows: 12, ...bind(textData, 'content') }),
    label('pictures'), input({ type: 'file', multiple: true, onchange: loadImages }),
    () => Pictures({ pictures: pictures.val, onupdate: updatePictures }),
    label('tags'), textarea(bind(textData, 'tags')),
    button({ onclick: submit }, 'save'),
    button({ class: 'ml-4', onclick: oncancel }, 'cancel'),
  );

  async function loadImages(event) {
    const newPictures = await Promise.all([...event.target.files].map(async (file) => {
      const url = await getLocalFileUrl(file);
      return { file, url, description: '', unsaved: true };
    }));
    updatePictures([...pictures.val, ...newPictures]);
  }

  function updatePictures(updatedPictures) {
    pictures.val = updatedPictures;
  }

  function submit() {
    console.debug('[note form] submit event');
    onsubmit({ ...textData.val, pictures: pictures.val });
  }
}

function Pictures({ pictures, onupdate }) {
  const selected = van.state(null);
  const editing = van.state(null);
  return div({ class: 'mb-4' },
    DragAndDropList({ class: 'flex flex-col gap-4 items-center max-h-152', onupdate: handleMove },
      pictures.map((pic) =>
        div({ class: 'relative' },
          img({ src: pic.url, class: 'block p-2 min-h-48 size-48 border', onclick: () => selected.val = pic }),
          () => pic === selected.val ?
            div(
              div({ class: 'overlay bg-transparent', onclick: unselect }),
              div({ class: 'overlay flex absolute flex-col justify-center items-center bg-theme' },
                div(
                  button({ onclick: openEditModal }, 'edit'),
                  button({ class: 'ml-4', onclick: confirmAndDelete }, 'delete'),
                ),
              ),
            ) : div(),
        ),
      )
    ),
    () => editing.val ? EditModal({ picture: editing.val, onupdate: updatePicture, onclose: () => editing.val = null }) : div(),
  );

  function unselect() {
    selected.val = null;
  }

  function openEditModal() {
    editing.val = selected.val;
    unselect();
  }

  function confirmAndDelete() {
    confirmAnd(() => onupdate(pictures.filter((p) => p !== selected.val)));
    unselect();
  }

  function handleMove(originalIndex, newIndex) {
    const clone = [...pictures];
    const [movedItem] = clone.splice(originalIndex, 1);
    clone.splice(newIndex, 0, movedItem);
    onupdate(clone);
  }

  function updatePicture(picture) {
    onupdate(pictures.map((p) => (p === editing.val ? picture : p)).filter((p) => !p.deleted));
  }
}

function EditModal({ onupdate, onclose, ...props }) {
  const picture = van.state(props.picture);
  return Modal({ onclose },
    () => img({ src: picture.val.url, class: 'block mx-auto mb-4 max-h-screen/2' }),
    input({ type: 'file', onchange: loadImage }),
    textarea({ rows: 5, ...bind(picture, 'description') }),
    button({ onclick: save }, 'save'),
    button({ class: 'ml-4', onclick: confirmAndDelete }, 'delete'),
    button({ class: 'ml-4', onclick: onclose }, 'cancel'),
  );

  async function loadImage(event) {
    const file = event.target.files[0];
    const url = await getLocalFileUrl(file);
    const { description } = picture.val;
    picture.val = { file, url, description, unsaved: true };
  }

  async function save() {
    onupdate(picture.val);
    onclose();
  }

  function confirmAndDelete() {
    confirmAnd(() => {
      onupdate({ ...props.picture, deleted: true });
      onclose();
    });
  }
}
