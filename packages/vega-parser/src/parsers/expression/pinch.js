export function pinchDistance() {
  return 'Math.sqrt('
    + 'Math.pow(event.touches[0].clientX - event.touches[1].clientX, 2) + '
    + 'Math.pow(event.touches[0].clientY - event.touches[1].clientY, 2)'
    + ')';
}

export function pinchAngle() {
  return 'Math.atan2('
    + 'event.touches[1].clientY - event.touches[0].clientY,'
    + 'event.touches[1].clientX - event.touches[0].clientX'
    + ')';
}
