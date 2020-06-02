export default function(count, paddingInner, paddingOuter) {
  const space = count - paddingInner + paddingOuter * 2;
  return count ? (space > 0 ? space : 1) : 0;
}
