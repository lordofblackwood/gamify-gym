export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const clamp = (value, min, max, fallback) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

export function normalizePhoto(photo) {
  if (
    !photo ||
    typeof photo.src !== "string" ||
    photo.src.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4 + 30 ||
    !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
      photo.src,
    ) ||
    !Number.isInteger(photo.width) ||
    !Number.isInteger(photo.height) ||
    photo.width < 1 ||
    photo.height < 1 ||
    photo.width * photo.height > 40000000
  )
    return null;
  return {
    src: photo.src,
    width: photo.width,
    height: photo.height,
    crop: {
      x: clamp(photo.crop?.x, 0, 100, 50),
      y: clamp(photo.crop?.y, 0, 100, 50),
      zoom: clamp(photo.crop?.zoom, 1, 3, 1),
    },
  };
}

// Frame geometry only; neither cropping nor the aura rewrites the original image.
export function photoFrameStyle(photo) {
  const width = Math.max(1, photo.width / photo.height) * photo.crop.zoom * 100;
  const height =
    Math.max(1, photo.height / photo.width) * photo.crop.zoom * 100;
  return {
    width: `${width}%`,
    height: `${height}%`,
    left: `${(-(width - 100) * photo.crop.x) / 100}%`,
    top: `${(-(height - 100) * photo.crop.y) / 100}%`,
  };
}

export async function readProfilePhoto(file) {
  if (!PHOTO_TYPES.includes(file.type))
    throw new Error("Choose a JPG, PNG, or WebP photo.");
  if (file.size > MAX_PHOTO_BYTES)
    throw new Error(
      "Choose a photo smaller than 2 MB so it can be saved on this device.",
    );
  const src = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error("This photo could not be read. Try another file."));
    reader.readAsDataURL(file);
  });
  const img = new Image();
  img.src = src;
  try {
    await img.decode();
  } catch {
    throw new Error(
      "This photo could not be opened. Try another JPG, PNG, or WebP.",
    );
  }
  const photo = normalizePhoto({
    src,
    width: img.naturalWidth,
    height: img.naturalHeight,
  });
  if (!photo) throw new Error("Choose a photo below 40 megapixels.");
  return photo;
}
