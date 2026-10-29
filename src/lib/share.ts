/** A bingo card someone opens on their own phone: everything it needs is in the link */
export interface CardLink {
  v: 1;
  title: string;
  cells: string[];
  seed: number;
  player: string;
}

export const CARD_PREFIX = "#bingo=";

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const fromBase64Url = (text: string) =>
  Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function pipe(
  bytes: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream
): Promise<Uint8Array> {
  return new Uint8Array(
    await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()
  );
}

/** JSON, deflated by the browser, base64url: short enough to send in a message */
export async function encodeCard(card: CardLink): Promise<string> {
  return toBase64Url(
    await pipe(new TextEncoder().encode(JSON.stringify(card)), new CompressionStream("deflate-raw"))
  );
}

/** Null for anything that isn't a card link (links are untrusted input) */
export async function decodeCard(text: string): Promise<CardLink | null> {
  try {
    const raw: unknown = JSON.parse(
      new TextDecoder().decode(
        await pipe(fromBase64Url(text), new DecompressionStream("deflate-raw"))
      )
    );
    if (typeof raw !== "object" || raw === null) return null;
    const c = raw as Partial<CardLink>;
    return c.v === 1 &&
      typeof c.title === "string" &&
      typeof c.seed === "number" &&
      typeof c.player === "string" &&
      Array.isArray(c.cells) &&
      c.cells.length >= 24 &&
      c.cells.every((x) => typeof x === "string")
      ? {
          v: 1,
          title: c.title.slice(0, 80),
          seed: c.seed,
          player: c.player.slice(0, 40),
          cells: c.cells.map((x) => x.slice(0, 60)),
        }
      : null;
  } catch {
    return null;
  }
}
