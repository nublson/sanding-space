(() => {
  const ALLOWED = ["https://sanding.space"];
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    ALLOWED.push(location.origin);
  }
  window.addEventListener("message", (event) => {
    if (!ALLOWED.includes(event.origin)) return;
    const data = event.data;
    if (!data || data.type !== "sanding:resize") return;
    const height = data.height;
    if (typeof height !== "number" || !Number.isFinite(height) || height <= 0)
      return;
    const frames = document.querySelectorAll("iframe[data-sanding]");
    for (const frame of frames) {
      if (frame.contentWindow === event.source) {
        frame.style.height = `${height}px`;
        return;
      }
    }
  });
})();
