# notes

## next

- feat: edit text in place
  - set cursor in right place on enter and backspace
  - create necessary items when pasting text with new line characters
- fix: allow text selection on touch devices and dragging selected text on mouse devices
  - keep track of editing boolean state and prevent click and hold drag when editing
    - event.stopPropagation()

- fix: when moving before/after empty line, it's hard to see where item will fall
  - option 1: show horizontal line where item will go (instead of moving placeholder)

test
- access token refresh on load when expired
- access token auto refresh before expiring


## backlog

- fix: (note form) prevent re-rendering images control (or re-render and scroll to position)
  - when a picture is
    - added
    - updated
    - deleted

maybe not
- feat: (details page) display images in second column on larger screens. position fixed
- feat: (note form) display images in second column on large screens
