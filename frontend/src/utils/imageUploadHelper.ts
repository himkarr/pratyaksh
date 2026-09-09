/**
 * Utility for optimizing and converting user-uploaded images to high-quality,
 * lightweight Base64 Data URLs or persistent Supabase storage URLs.
 * 
 * Ensures images upload cleanly into PostgreSQL/Supabase database tables
 * without breaking due to ephemeral blob URLs or excessive file sizes.
 */

/**
 * Converts a browser File/Blob object into an optimized, high-DPI Base64 Data URL.
 * Automatically downscales large camera photos to a max dimension while maintaining
 * sharp clarity and low payload size (~80-250KB).
 */
export async function fileToOptimizedDataUrl(
  file: File | Blob,
  maxWidth: number = 1280,
  maxHeight: number = 1280,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's not an image (e.g. PDF), read as raw data URL
    if (file.type && !file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // Compute aspect-ratio preserved dimensions
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // Fallback to raw data url if canvas not supported
            resolve(e.target?.result as string);
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG with specified quality
          const optimizedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(optimizedDataUrl);
        } catch (err) {
          console.warn("Canvas image optimization fallback:", err);
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Validates if a URL is a valid displayable image URL (HTTP, HTTPS, or Base64 Data URL)
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("data:image/") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return true;
  }
  return false;
}

/**
 * Returns a reliable fallback image for a given category if user photo is missing or broken.
 */
export function getCategoryFallbackImage(category?: string): string {
  const cat = (category || "").toLowerCase();
  if (cat.includes("water") || cat.includes("tap") || cat.includes("pipeline") || cat.includes("drain")) {
    return "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80";
  }
  if (cat.includes("road") || cat.includes("bridge") || cat.includes("highway") || cat.includes("street")) {
    return "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80";
  }
  if (cat.includes("school") || cat.includes("education") || cat.includes("classroom") || cat.includes("lab")) {
    return "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80";
  }
  if (cat.includes("health") || cat.includes("hospital") || cat.includes("clinic") || cat.includes("medical")) {
    return "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80";
  }
  if (cat.includes("solar") || cat.includes("energy") || cat.includes("electric")) {
    return "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80";
  }
  return "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80";
}
