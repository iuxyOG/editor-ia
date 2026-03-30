/**
 * Validates file type by reading magic bytes (first 12 bytes).
 * Does not rely on Content-Type header which can be spoofed.
 */

// Magic byte signatures for video formats
const SIGNATURES: Array<{ bytes: number[]; offset: number; type: string }> = [
  // MP4 / M4V (ftyp box)
  { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4, type: 'video/mp4' },
  // MOV (moov atom or ftyp qt)
  { bytes: [0x6D, 0x6F, 0x6F, 0x76], offset: 4, type: 'video/quicktime' },
  { bytes: [0x66, 0x74, 0x79, 0x70, 0x71, 0x74], offset: 4, type: 'video/quicktime' },
  // AVI
  { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, type: 'video/x-msvideo' },
];

export function validateVideoMimeType(headerBytes: Uint8Array): string | null {
  for (const sig of SIGNATURES) {
    if (headerBytes.length < sig.offset + sig.bytes.length) continue;

    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (headerBytes[sig.offset + i] !== sig.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) return sig.type;
  }
  return null;
}

/**
 * Sanitizes a filename for safe filesystem storage.
 * Removes path traversal, special chars, and limits length.
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/\.\./g, '') // no path traversal
    .replace(/[/\\]/g, '') // no slashes
    .replace(/[^a-zA-Z0-9._-]/g, '_') // only safe chars
    .slice(0, 200); // limit length
}

/**
 * Validates that a URL path doesn't contain path traversal.
 */
export function isPathSafe(urlPath: string): boolean {
  const normalized = urlPath.replace(/\\/g, '/');
  return !normalized.includes('..') && !normalized.startsWith('/');
}
