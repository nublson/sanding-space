/**
 * Fonts for generated images. Satori needs raw font data, and next/font keeps
 * its files out of reach, so the TTF comes from Google Fonts at render time
 * (at build, for every statically generated image). A plain request to the
 * CSS API answers with a TrueType source, and the `text` parameter subsets the
 * file to the glyphs the image uses.
 */
export async function loadGoogleFont(
  family: string,
  weight: number,
  text: string,
): Promise<ArrayBuffer> {
  const params = new URLSearchParams({
    family: `${family}:wght@${weight}`,
    text,
  });
  const css = await fetch(`https://fonts.googleapis.com/css2?${params}`).then(
    (r) => {
      if (!r.ok) throw new Error(`Google Fonts CSS for ${family}: ${r.status}`);
      return r.text();
    },
  );
  const url = /src: url\((.+?)\) format\('(?:truetype|opentype|woff)'\)/.exec(
    css,
  )?.[1];
  if (!url) throw new Error(`No usable font source for ${family} ${weight}`);
  const font = await fetch(url);
  if (!font.ok)
    throw new Error(`Google Fonts file for ${family}: ${font.status}`);
  return font.arrayBuffer();
}
