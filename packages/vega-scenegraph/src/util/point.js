export default function(event, el) {
  const rect = el.getBoundingClientRect();
  return mapPointToElementOffset(
    [
      event.clientX - rect.left - (el.clientLeft || 0),
      event.clientY - rect.top - (el.clientTop || 0)
    ],
    el
  );
}

function mapPointToElementOffset([x, y], el) {
  const rect = el.getBoundingClientRect();
  const [offsetWidth, offsetHeight] = getElementOffset(el);

  const scaleX = offsetWidth ? rect.width / offsetWidth : 1;
  const scaleY = offsetHeight ? rect.height / offsetHeight : 1;

  return [x / scaleX, y / scaleY];
}

/**
 * Retrieves the `offsetWidth` and `offsetHeight` of the given element.
 * If not available, creates a container within the element to determine it.
 *
 * @param {Element} el - The target element.
 * @returns {[offsetWidth: number, offsetHeight: number]} The element's offset.
 */
function getElementOffset(el) {
  const offsetWidth = el.offsetWidth;
  const offsetHeight = el.offsetHeight;
  if (offsetWidth !== undefined && offsetHeight !== undefined) {
    return [offsetWidth, offsetHeight];
  }

  let offsetTarget = el.querySelector(
    '[data-offset-target-container]>[data-offset-target]'
  );

  if (!offsetTarget) {
    el.style.position = 'relative';

    const namespace = 'http://www.w3.org/2000/svg';

    const offsetTargetContainer = document.createElementNS(
      namespace,
      'foreignObject'
    );
    offsetTargetContainer.setAttribute('x', '0');
    offsetTargetContainer.setAttribute('width', '100%');
    offsetTargetContainer.setAttribute('height', '100%');
    offsetTargetContainer.setAttribute('data-offset-target-container', true);
    Object.assign(offsetTargetContainer.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '100%',
      height: '100%',
      visibility: 'hidden',
      pointerEvents: 'none'
    });

    offsetTarget = document.createElement('div');
    offsetTarget.setAttribute('data-offset-target', true);
    Object.assign(offsetTarget.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '100%',
      height: '100%'
    });

    offsetTargetContainer.appendChild(offsetTarget);
    el.appendChild(offsetTargetContainer);
  }

  return [offsetTarget.offsetWidth, offsetTarget.offsetHeight];
}
