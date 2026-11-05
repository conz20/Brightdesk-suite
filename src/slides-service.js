'use strict';

(function (root, factory) {
  const service = factory();
  if (typeof module === 'object' && module.exports) module.exports = service;
  if (root) root.BrightdeskSlidesService = service;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function assertPresentation(presentation) {
    if (!presentation || typeof presentation !== 'object' || Array.isArray(presentation)) {
      throw new TypeError('A presentation object is required.');
    }
    return presentation;
  }

  function normalizeSlide(slide) {
    const source = slide && typeof slide === 'object' && !Array.isArray(slide) ? slide : {};
    return {
      title: String(source.title ?? ''),
      body: String(source.body ?? '')
    };
  }

  function ensurePresentation(presentation, firstSlideTitle = 'Slide 1') {
    const target = assertPresentation(presentation);
    if (!Array.isArray(target.slides) || target.slides.length === 0) {
      target.slides = [{ title: String(firstSlideTitle), body: '' }];
    } else {
      target.slides = target.slides.map(normalizeSlide);
    }
    const requested = Number.isInteger(target.current) ? target.current : 0;
    target.current = Math.max(0, Math.min(requested, target.slides.length - 1));
    return target;
  }

  function assertSlideIndex(presentation, index) {
    if (!Number.isInteger(index) || index < 0 || index >= presentation.slides.length) {
      throw new RangeError('Slide index is outside the presentation.');
    }
  }

  function addSlide(presentation, slide = {}) {
    const target = ensurePresentation(presentation);
    const source = slide && typeof slide === 'object' && !Array.isArray(slide) ? slide : {};
    const next = {
      title: String(source.title ?? `Slide ${target.slides.length + 1}`),
      body: String(source.body ?? '')
    };
    target.slides.push(next);
    target.current = target.slides.length - 1;
    return next;
  }

  function duplicateSlide(presentation, index) {
    const target = ensurePresentation(presentation);
    const selected = index === undefined ? target.current : index;
    assertSlideIndex(target, selected);
    const source = target.slides[selected];
    const copy = { title: source.title, body: source.body };
    target.slides.splice(selected + 1, 0, copy);
    target.current = selected + 1;
    return copy;
  }

  function deleteSlide(presentation, index) {
    const target = ensurePresentation(presentation);
    const selected = index === undefined ? target.current : index;
    assertSlideIndex(target, selected);
    if (target.slides.length === 1) return false;
    target.slides.splice(selected, 1);
    target.current = Math.max(0, Math.min(selected - 1, target.slides.length - 1));
    return true;
  }

  function updateSlide(presentation, index, patch = {}) {
    const target = ensurePresentation(presentation);
    assertSlideIndex(target, index);
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      throw new TypeError('Slide changes must be an object.');
    }
    const slide = target.slides[index];
    if (Object.prototype.hasOwnProperty.call(patch, 'title')) slide.title = String(patch.title ?? '');
    if (Object.prototype.hasOwnProperty.call(patch, 'body')) slide.body = String(patch.body ?? '');
    return slide;
  }

  function setCurrentSlide(presentation, index) {
    const target = ensurePresentation(presentation);
    assertSlideIndex(target, index);
    target.current = index;
    return target.current;
  }

  return {
    ensurePresentation,
    addSlide,
    duplicateSlide,
    deleteSlide,
    updateSlide,
    setCurrentSlide
  };
});
