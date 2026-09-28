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
script.js      Phone menu, anchor scrolling, the modals, the full-screen
               image viewer, scroll reveal and nav highlighting.
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
of padding means a small margin, little padding means a large one. The offset
is derived — `max(8px, calc(var(--nav-h) - var(--section-y) + 28px))` — because
both terms move with the breakpoints: the nav changes height and `--section-y`
shrinks. A flat number looked right on desktop and pushed content *behind* the
nav on a phone. `--nav-h` is declared in `:root` and overridden in the ≤600px
block; update it if you change the nav's height or padding.

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
gutters. Below 900px the two-column sections stack. Below 600px it switches to
the phone layout described next. The Figma file is desktop-only, so everything
below 900px was decided in code rather than designed.

**Phone layout (≤600px).**

- The nav collapses to a wordmark plus a disclosure button, and the links drop
  into a panel. It is 64px tall instead of the 130px the earlier stacked
  version took — that was 15% of an iPhone screen, held there by
  `position: sticky`. The panel is `position: absolute`, so opening it does
  **not** change the nav's height; every anchor offset is measured against
  that height, and an in-flow panel would throw them all off.
- The process grid drops to **one column**. Four abreast left each stage about
  156px, too small to read the shadow and blending work the section exists to
  show.
- `@media (hover: none)` keeps the expand badge visible on every zoomable
  image. It is hover-only elsewhere, so on a touch screen nothing would have
  suggested the images open.
- The viewer supports **swipe** left/right, and its controls are 44px.
- The viewer is sized in `dvh`, so it does not run under a phone browser's
  collapsing address bar the way `100vh` does.

**Watch `height: auto` on `.stage img`.** Those images carry `height="327"`,
and while that attribute leaves height non-auto, `aspect-ratio` is silently
ignored — the image rendered 156×327 and cropped to a tall slice. It only
looked correct on desktop because the column happened to be 327px wide. Any
image you size with CSS while it also has width/height attributes needs the
same treatment.

**Accessibility**: cards are real `<button>` elements so they work from the
keyboard, every image has alt text, there is a skip link, and
`prefers-reduced-motion` is respected.



## The résumé

Both the nav link and the contact button point at `assets/resume.pdf`. It is
exported by hand from the source document — **after editing, re-export**
(File → Download → PDF Document) and overwrite that file. Nothing syncs
automatically.


## Deploying

It is a static folder, so anything works. Vercel, the same as FullPlate:

```bash
npx vercel deploy --prod
```
