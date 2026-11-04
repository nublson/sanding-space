/**
 * Copies text that may still be loading. Safari allows a clipboard write only
 * within the tap that asked for it, so a pending text goes in as a
 * `ClipboardItem` promise, written at once; elsewhere the text is awaited and
 * written plainly, then by a hidden textarea as the last resort.
 */
export async function copyText(text: string | Promise<string>): Promise<void> {
  const clipboard =
    typeof navigator === "undefined" ? undefined : navigator.clipboard;
  if (typeof ClipboardItem === "function" && clipboard?.write) {
    const blob = Promise.resolve(text).then(
      (t) => new Blob([t], { type: "text/plain" }),
    );
    try {
      await clipboard.write([new ClipboardItem({ "text/plain": blob })]);
      return;
    } catch {
      // A browser without promise items, or a refused write: try plain text.
    }
  }
  const value = await text;
  try {
    if (!clipboard?.writeText) throw new Error("No clipboard");
    await clipboard.writeText(value);
  } catch {
    copyWithTextarea(value);
  }
}

function copyWithTextarea(value: string) {
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) throw new Error("Couldn't copy");
}
