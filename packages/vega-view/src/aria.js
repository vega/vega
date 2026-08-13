// initialize aria role and label attributes
export function initializeAria(view) {
  const el = view.container();
  if (el) {
    ariaRole(el, view.ariaRole());
    ariaRoleDescription(el, view.ariaRoleDescription());
    ariaLabel(el, view.description());
  }
}

// update aria-label if we have a DOM container element
export function ariaLabel(el, desc) {
  if (el) desc == null
    ? el.removeAttribute('aria-label')
    : el.setAttribute('aria-label', desc);
}

// update role if we have a DOM container element
export function ariaRole(el, desc) {
  if (el) desc == null
    ? el.setAttribute('role', 'graphics-document')
    : el.setAttribute('role', desc + ' graphics-document');
}

// update aria-roledescription if we have a DOM container element
export function ariaRoleDescription(el, desc) {
  if (el) desc == null
    ? el.setAttribute('aria-roledescription', 'visualization')
    : el.setAttribute('aria-roledescription', desc);
}
