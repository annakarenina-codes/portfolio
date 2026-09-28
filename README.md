# Anna Karenina Sanglay — portfolio

Static site built from the Figma mockup:
<https://www.figma.com/design/jPAiLmXJi2sKtDGDBdCivb>

Plain HTML, CSS and JavaScript. No build step, no dependencies, no framework.

## Run it

Open `index.html` directly, or serve the folder:

```bash
python -m http.server 8777
```

Then visit <http://127.0.0.1:8777/>.

## Files

```
index.html     One page: nav, hero/about, process, work, contact, footer,
               plus three <dialog> modals at the bottom.
styles.css     All styling. Design tokens are the :root custom properties
               at the top and mirror the "Portfolio" variable collection
               in Figma — change a colour there and it changes everywhere.
script.js      Opens and closes the modals. ~60 lines.
assets/        pubmats/ process/ logos/ web/ tools/
               Web-sized copies; the originals stay in the parent folder.
               `-sm` files are the smaller versions used above the fold.
```

## Notes

**Modals and the image viewer** are both native `<dialog>` elements, so the
backdrop, the top layer and Esc-to-close come from the browser. They stack:
the viewer opens over an already-open modal, and Esc closes whichever is on
top.

Scrolling behind them is blocked with `overflow` on `<html>`. Instead of
pairing every open with a matching release, `syncScrollLock()` asks the
document whether *any* dialog is still open — so closing the viewer while a
modal is still open correctly keeps the page locked. It avoids depending on
the `close` event, which does not fire in every embedded engine and would
otherwise strand the page unscrollable.

**Clickable images.** Any `img` inside a `[data-gallery="name"]` container
becomes a full-screen-viewable image, and the container defines the set you
page through. A standalone `img[data-zoom]` opens on its own. JavaScript
wraps each one in a `<button>` at load — so they are keyboard-reachable, and
so that without JavaScript they stay plain images rather than dead buttons.
In the viewer: **←/→** to move, **Esc** to close, click the dark area to
dismiss; focus returns to the image you came from. Captions are taken from a
neighbouring `.stage__caption` if there is one, otherwise from the alt text.

To add a new gallery, mark the container with `data-gallery` — nothing else
is needed.

**Anchor jumps.** Sections use `scroll-margin-top` so a jump clears the sticky
nav. The value is deliberately *small* (8px) for most of them, because they
already carry ~110px of internal top padding — adding the full nav height on
top of that drops their content far too low. Contact is the exception: it has
almost no top padding, so it takes `calc(var(--nav-h) + 28px)`.

**If you add a section, match its scroll-margin to its own top padding**: lots
of padding means a small margin, little padding means a large one. `--nav-h`
is declared in `:root` and overridden in the ≤600px block where the nav stacks
onto two lines — update it if you change the nav's height or padding.

The scrolling itself is animated in `script.js` rather than with CSS
`scroll-behavior: smooth`, so the destination never depends on animation
frames arriving: the tween runs when it can, and a timeout hard-sets the
final position when frames are throttled. Clicking the same nav link twice
re-scrolls, which native fragment navigation does not.

**Scroll reveal and nav highlighting** use `IntersectionObserver`. Reveal is
opt-in via `data-reveal` (or `data-reveal-children` to stagger a row), and it
only activates once JavaScript confirms the API exists and the visitor has no
reduced-motion preference — otherwise everything is simply visible.

**Layout** matches the mockup at 1440px: a 1120px content column with 40px
gutters. Below 900px the two-column sections stack, and below 600px the nav
stacks onto two lines. Those breakpoints are sensible defaults, not designed
layouts — the Figma file is desktop-only.

**Accessibility**: cards are real `<button>` elements so they work from the
keyboard, every image has alt text, there is a skip link, and
`prefers-reduced-motion` is respected.

## The résumé

`assets/resume.pdf` is exported from the Google Doc that is the source of
truth:
<https://docs.google.com/document/d/1sa6Osf5nOTVXNhAv4A7k3C9jPbsxu12t-B9gOHmsjmg/edit>

Both the nav link and the contact button point at that file. **After editing
the doc, re-export it** — File → Download → PDF Document — and overwrite
`assets/resume.pdf`. Nothing syncs automatically.

## Still to do

- [ ] Fill the résumé placeholders: portfolio URL, the two project date
      ranges, and interests.
- [ ] Decide whether the Websites modal should become its own page. A live
      site inside a lightbox is the one place the layout fights the content.

## Deploying

It is a static folder, so anything works. Vercel, the same as FullPlate:

```bash
npx vercel deploy --prod
```
