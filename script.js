/* Portfolio behaviour: category modals, a full-screen image viewer,
   scroll reveal and nav scroll-spy.

   Modals and the viewer are both native <dialog> elements. They stack in the
   browser's top layer, so the viewer opens cleanly over an already-open modal
   and Esc always closes whichever is on top.

   Scrolling behind them is blocked with overflow on <html>. Rather than
   pairing every open with a matching release — the `close` event does not
   fire in every embedded engine, which would strand the page unscrollable —
   syncScrollLock() just asks the document whether any dialog is still open.
   It is idempotent, so calling it too often costs nothing. */

(function () {
  'use strict';

  var root = document.documentElement;
  var stillMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function syncScrollLock() {
    root.style.overflow = document.querySelector('dialog[open]') ? 'hidden' : '';
  }

  /* ---------------- in-page anchor jumps ----------------

     Animated here by hand rather than with the platform's smooth scrolling,
     for one reason: the landing position must not depend on animation frames
     arriving. In a hidden or throttled tab requestAnimationFrame stops and
     native smooth scrolling stalls with it, which would leave a click on
     "Contact" updating the URL while the page never moves. The tween below
     runs when frames are available and a timeout hard-sets the destination
     when they are not, so the jump always lands. It also re-scrolls when the
     same link is clicked twice, which native fragment navigation skips. */

  function destinationFor(el) {
    // Respect the scroll-margin-top that clears the sticky nav.
    var clearance = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    var y = window.scrollY + el.getBoundingClientRect().top - clearance;
    var furthest = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(Math.round(y), furthest));
  }

  function glideTo(y) {
    if (stillMotion) { window.scrollTo(0, y); return; }

    var from = window.scrollY;
    var distance = y - from;
    if (!distance) return;

    // Long jumps take a little longer, but never drag.
    var duration = Math.min(900, Math.max(320, Math.abs(distance) * 0.45));
    var startedAt = null;
    var landed = false;

    function easeInOutCubic(p) {
      return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    }

    function frame(now) {
      if (startedAt === null) startedAt = now;
      var progress = Math.min(1, (now - startedAt) / duration);
      window.scrollTo(0, Math.round(from + distance * easeInOutCubic(progress)));
      if (progress < 1) requestAnimationFrame(frame);
      else landed = true;
    }
    requestAnimationFrame(frame);

    // Frames may never arrive — a hidden or heavily throttled tab. Land anyway.
    window.setTimeout(function () { if (!landed) window.scrollTo(0, y); }, duration + 250);
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var id = link.getAttribute('href').slice(1);
      if (!id) return;

      if (id === 'top') {
        event.preventDefault();
        glideTo(0);
        history.replaceState(null, '', location.pathname + location.search);
        return;
      }

      var target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      glideTo(destinationFor(target));
      history.replaceState(null, '', '#' + id);
    });
  });

  /* ---------------- full-screen image viewer ---------------- */

  var lb       = document.getElementById('lightbox');
  var lbImg    = lb.querySelector('.lightbox__img');
  var lbText   = lb.querySelector('.lightbox__text');
  var lbCount  = lb.querySelector('.lightbox__count');
  var lbNavs   = lb.querySelectorAll('.lightbox__nav');
  var lbPrev   = lb.querySelector('.lightbox__nav--prev');
  var lbNext   = lb.querySelector('.lightbox__nav--next');
  var lbClose  = lb.querySelector('.lightbox__close');

  var group = [];      // the images currently being browsed
  var index = 0;
  var opener = null;   // button to return focus to on close

  // Prefer a visible caption next to the image; fall back to its alt text.
  function captionFor(img) {
    var li  = img.closest('li');
    var cap = li && li.querySelector('.stage__caption');
    return cap ? cap.textContent.replace(/\s+/g, ' ').trim() : (img.getAttribute('alt') || '');
  }

  function render() {
    var item = group[index];
    lbImg.src = item.src;
    lbImg.alt = item.alt;
    lbText.textContent = item.caption;
    lbCount.textContent = group.length > 1 ? (index + 1) + ' / ' + group.length : '';
    for (var i = 0; i < lbNavs.length; i++) lbNavs[i].hidden = group.length < 2;
  }

  function step(delta) {
    if (group.length < 2) return;
    index = (index + delta + group.length) % group.length;
    render();
  }

  function openViewer(images, start, trigger) {
    group = images.map(function (img) {
      return { src: img.src, alt: img.getAttribute('alt') || '', caption: captionFor(img) };
    });
    index = start;
    opener = trigger || null;
    render();
    lb.showModal();
    syncScrollLock();
  }

  function closeViewer() {
    if (lb.open) lb.close();
    syncScrollLock();
    if (opener) { try { opener.focus(); } catch (e) { /* element may be gone */ } }
  }

  lbClose.addEventListener('click', closeViewer);
  lbPrev.addEventListener('click', function () { step(-1); });
  lbNext.addEventListener('click', function () { step(1); });

  // Clicking the dark area around the image closes; clicking the image does not.
  lb.addEventListener('click', function (event) {
    if (event.target === lb || event.target.classList.contains('lightbox__figure')) closeViewer();
  });

  lb.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    else if (event.key === 'Escape') {
      // The browser closes it for us; just restore state afterwards.
      window.setTimeout(function () { syncScrollLock(); if (opener) { try { opener.focus(); } catch (e) {} } }, 0);
    }
  });

  /* Wrap each gallery image in a button so it is clickable and reachable by
     keyboard. Done here rather than in the markup so that without JS the
     images stay plain images instead of dead buttons. */
  function makeZoomable(images) {
    if (!images.length) return;
    images.forEach(function (img, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'zoom';
      btn.setAttribute('aria-label', 'View larger: ' + (img.getAttribute('alt') || 'image'));
      img.parentNode.insertBefore(btn, img);
      btn.appendChild(img);
      btn.addEventListener('click', function () { openViewer(images, i, btn); });
    });
  }

  document.querySelectorAll('[data-gallery]').forEach(function (gallery) {
    makeZoomable(Array.prototype.slice.call(gallery.querySelectorAll('img')));
  });
  // Standalone images browse on their own.
  document.querySelectorAll('img[data-zoom]').forEach(function (img) {
    if (!img.closest('[data-gallery]')) makeZoomable([img]);
  });

  /* ---------------- category modals ---------------- */

  document.querySelectorAll('[data-modal]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var dialog = document.getElementById(trigger.dataset.modal);
      if (!dialog || dialog.open) return;
      dialog.showModal();
      syncScrollLock();
    });
  });

  document.querySelectorAll('dialog.modal').forEach(function (dialog) {
    var closeBtn = dialog.querySelector('.modal__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () { dialog.close(); syncScrollLock(); });
    }

    // Only a backdrop click lands on the dialog itself; content sits in .modal__card.
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) { dialog.close(); syncScrollLock(); }
    });

    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') window.setTimeout(syncScrollLock, 0);
    });

    dialog.addEventListener('cancel', syncScrollLock);
    dialog.addEventListener('close', syncScrollLock);
  });

  /* ---------------- scroll reveal ---------------- */

  if (!stillMotion && 'IntersectionObserver' in window) {
    root.classList.add('js-reveal');
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        reveal.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    document.querySelectorAll('[data-reveal], [data-reveal-children]').forEach(function (el) {
      reveal.observe(el);
    });
  }

  /* ---------------- nav scroll-spy ---------------- */

  if ('IntersectionObserver' in window) {
    var links = {};
    document.querySelectorAll('.nav__links a[href^="#"]').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = links[entry.target.id];
        if (link) link.classList.toggle('is-active', entry.isIntersecting);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(links).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }
})();
