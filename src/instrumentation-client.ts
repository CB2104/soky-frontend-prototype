// Must run before AppRouter registers popstate: its handler can synchronously
// unmount an editor before a later listener has a chance to protect the draft.
// Without a mounted dirty admin editor, this leaves navigation untouched.
window.addEventListener("popstate", (event: PopStateEvent) => {
  window.dispatchEvent(new CustomEvent("soky-admin-pop", { detail: event }));
}, true);
