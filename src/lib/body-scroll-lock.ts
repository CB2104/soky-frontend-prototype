type LockState = {
  count: number;
  overflow: string;
  paddingRight: string;
};

const locks = new WeakMap<Document, LockState>();

export function lockBodyScroll(doc: Document = document): () => void {
  let state = locks.get(doc);
  if (!state) {
    const body = doc.body;
    const view = doc.defaultView;
    state = {
      count: 0,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    };
    locks.set(doc, state);
    const gap = view
      ? Math.max(0, view.innerWidth - doc.documentElement.clientWidth)
      : 0;
    const padding = view
      ? parseFloat(view.getComputedStyle(body).paddingRight) || 0
      : 0;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = String(padding + gap) + "px";
  }
  state.count += 1;
  let released = false;

  return () => {
    if (released) return;
    released = true;
    state.count -= 1;
    if (state.count > 0) return;
    doc.body.style.overflow = state.overflow;
    doc.body.style.paddingRight = state.paddingRight;
    locks.delete(doc);
  };
}
