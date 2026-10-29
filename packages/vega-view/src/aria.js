// initialize aria role and label attributes
export function initializeAria(view) {
  const el = view.container();
  if (el) {
    const loc = view.ariaLocale();
    el.setAttribute('role', 'graphics-document');
    el.setAttribute('aria-roleDescription',
      loc['role.visualization'] || 'visualization');
    ariaLabel(el, view.description());
  }
}

// update aria-label if we have a DOM container element
export function ariaLabel(el, desc) {
  if (el) desc == null
    ? el.removeAttribute('aria-label')
    : el.setAttribute('aria-label', desc);
}
