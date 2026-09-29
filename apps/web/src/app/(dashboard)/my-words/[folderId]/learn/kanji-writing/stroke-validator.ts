export interface Point {
  x: number;
  y: number;
}

export interface TargetStroke {
  key: string;
  character: string;
  characterIndex: number;
  strokeNumber: number;
  path: string;
  points: Point[];
}

export interface PositionedTargetStroke extends TargetStroke {
  cellSize: number;
  positionedPoints: Point[];
}

export type StrokeMatchResult =
  | { accepted: true }
  | { accepted: false; reason: "too-short" | "direction" | "length" | "accuracy" };

const kanjiVgBaseUrl = "https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji";
const strokeCache = new Map<string, Promise<TargetStroke[]>>();
const svgNamespace = "http://www.w3.org/2000/svg";

function samplePath(pathData: string): Point[] {
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("viewBox", "0 0 109 109");
  svg.setAttribute("width", "109");
  svg.setAttribute("height", "109");
  Object.assign(svg.style, { position: "fixed", left: "-10000px", top: "0", visibility: "hidden" });

  const path = document.createElementNS(svgNamespace, "path");
  path.setAttribute("d", pathData);
  svg.appendChild(path);
  document.body.appendChild(svg);

  try {
    const length = path.getTotalLength();
    if (!Number.isFinite(length) || length <= 0) return [];
    const sampleCount = Math.max(16, Math.min(100, Math.ceil(length / 2)));
    return Array.from({ length: sampleCount + 1 }, (_, index) => {
      const point = path.getPointAtLength((length * index) / sampleCount);
      return { x: point.x, y: point.y };
    });
  } finally {
    svg.remove();
  }
}

async function fetchCharacterStrokes(character: string, characterIndex: number): Promise<TargetStroke[]> {
  const codepoint = character.codePointAt(0);
  if (codepoint === undefined) return [];

  const filename = `${codepoint.toString(16).padStart(5, "0")}.svg`;
  const response = await fetch(`${kanjiVgBaseUrl}/${filename}`);
  if (!response.ok) throw new Error(`KanjiVG data unavailable for ${character}`);

  const source = await response.text();
  const svg = new DOMParser().parseFromString(source, "image/svg+xml");
  if (svg.querySelector("parsererror")) throw new Error(`Invalid KanjiVG data for ${character}`);

  const paths = Array.from(svg.querySelectorAll("path[id]"))
    .map((element) => {
      const id = element.getAttribute("id") || "";
      const number = Number(id.match(/-s(\d+)$/)?.[1]);
      const path = element.getAttribute("d") || "";
      return { number, path };
    })
    .filter((stroke) => Number.isFinite(stroke.number) && stroke.number > 0 && stroke.path.length > 0)
    .sort((left, right) => left.number - right.number);

  if (paths.length === 0) throw new Error(`No stroke paths found for ${character}`);

  return paths.map(({ number, path }) => ({
    key: `${characterIndex}-${number}`,
    character,
    characterIndex,
    strokeNumber: number,
    path,
    points: samplePath(path),
  }));
}

export function loadTargetStrokes(character: string, characterIndex: number): Promise<TargetStroke[]> {
  const cacheKey = `${character}:${characterIndex}`;
  const cached = strokeCache.get(cacheKey);
  if (cached) return cached;

  const pending = fetchCharacterStrokes(character, characterIndex).catch((error: unknown) => {
    strokeCache.delete(cacheKey);
    throw error;
  });
  strokeCache.set(cacheKey, pending);
  return pending;
}

function pathLength(points: Point[]): number {
  let length = 0;
  for (let index = 1; index < points.length; index++) {
    length += Math.hypot(points[index]!.x - points[index - 1]!.x, points[index]!.y - points[index - 1]!.y);
  }
  return length;
}

function resample(points: Point[], count: number): Point[] {
  if (points.length === 0) return [];
  const totalLength = pathLength(points);
  if (totalLength === 0) return Array.from({ length: count }, () => points[0]!);

  const result: Point[] = [];
  let segmentIndex = 1;
  let traversed = 0;
  for (let sample = 0; sample < count; sample++) {
    const targetLength = (totalLength * sample) / (count - 1);
    while (segmentIndex < points.length - 1) {
      const segmentLength = Math.hypot(
        points[segmentIndex]!.x - points[segmentIndex - 1]!.x,
        points[segmentIndex]!.y - points[segmentIndex - 1]!.y,
      );
      if (traversed + segmentLength >= targetLength) break;
      traversed += segmentLength;
      segmentIndex++;
    }

    const start = points[segmentIndex - 1]!;
    const end = points[segmentIndex]!;
    const segmentLength = Math.hypot(end.x - start.x, end.y - start.y);
    const ratio = segmentLength === 0 ? 0 : (targetLength - traversed) / segmentLength;
    result.push({ x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio });
  }
  return result;
}

export function validateStroke(
  userStroke: Point[],
  targetPoints: Point[],
  strokeTolerance: number,
): StrokeMatchResult {
  if (userStroke.length === 0 || targetPoints.length < 2) return { accepted: false, reason: "too-short" };

  const userLength = pathLength(userStroke);
  const targetLength = pathLength(targetPoints);
  if (targetLength <= strokeTolerance * 1.2 && userLength <= strokeTolerance * 0.8) {
    const startDistance = Math.min(...targetPoints.map((point) => Math.hypot(userStroke[0]!.x - point.x, userStroke[0]!.y - point.y)));
    return startDistance <= strokeTolerance ? { accepted: true } : { accepted: false, reason: "accuracy" };
  }
  if (userStroke.length < 2) return { accepted: false, reason: "too-short" };
  if (userLength < targetLength * 0.5) return { accepted: false, reason: "too-short" };

  const forwardStart = Math.hypot(userStroke[0]!.x - targetPoints[0]!.x, userStroke[0]!.y - targetPoints[0]!.y);
  const forwardEnd = Math.hypot(userStroke[userStroke.length - 1]!.x - targetPoints[targetPoints.length - 1]!.x, userStroke[userStroke.length - 1]!.y - targetPoints[targetPoints.length - 1]!.y);
  if (forwardStart > strokeTolerance * 1.5 || forwardEnd > strokeTolerance * 1.5) {
    return { accepted: false, reason: "direction" };
  }

  const lengthRatio = userLength / targetLength;
  if (lengthRatio < 0.55 || lengthRatio > 1.65) return { accepted: false, reason: "length" };

  const sampleCount = 32;
  const userSamples = resample(userStroke, sampleCount);
  const targetSamples = resample(targetPoints, sampleCount);
  const distances = userSamples.map((point, index) =>
    Math.hypot(point.x - targetSamples[index]!.x, point.y - targetSamples[index]!.y),
  );
  const withinTolerance = distances.filter((distance) => distance <= strokeTolerance * 1.5).length / sampleCount;
  const averageDistance = distances.reduce((sum, distance) => sum + distance, 0) / sampleCount;

  return withinTolerance >= 0.8 && averageDistance <= strokeTolerance
    ? { accepted: true }
    : { accepted: false, reason: "accuracy" };
}
