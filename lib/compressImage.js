/**
 * Compress an image file client-side using Canvas before uploading.
 * Returns a new File object with reduced size.
 *
 * @param {File} file - The original image file
 * @param {Object} options
 * @param {number} options.maxWidth - Max width in px (default 1200)
 * @param {number} options.maxHeight - Max height in px (default 1200)
 * @param {number} options.quality - JPEG quality 0-1 (default 0.7)
 * @param {number} options.maxSizeMB - Target max size in MB (default 1)
 * @returns {Promise<File>}
 */
export default function compressImage(
  file,
  { maxWidth = 1200, maxHeight = 1200, quality = 0.7, maxSizeMB = 1 } = {}
) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Not an image file"));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        let { width, height } = img;

        // Scale down if exceeds max dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Use iterative quality reduction if still too large
        const tryCompress = (q) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("Compression failed"));

              if (blob.size > maxSizeMB * 1024 * 1024 && q > 0.3) {
                return tryCompress(q - 0.1);
              }

              const compressed = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressed);
            },
            "image/jpeg",
            q
          );
        };

        tryCompress(quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
