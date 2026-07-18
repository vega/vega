export default function debounce<T>(delay: number, handler: (event: T) => void): (event: T) => void {
  let tid: ReturnType<typeof setTimeout> | null = null;

  return (e: T) => {
    if (tid) clearTimeout(tid);
    tid = setTimeout(
      () => (handler(e), tid = null),
      delay
    );
  };
}
