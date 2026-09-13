/**
 * Image Compression Utility
 * Resizes and compresses user-uploaded avatars and cover images to high-performance base64 data URLs.
 * Ensures document size remains far below Firestore's 1MB limit (typically ~15KB to ~40KB),
 * preventing upload failures and ensuring persistent storage across page refreshes.
 */

export async function compressAvatar(
  source: File | string,
  maxDimension = 256,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof source === 'string' ? source : '');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (err) {
        console.warn('Avatar compression error, falling back:', err);
        if (typeof source === 'string') resolve(source);
        else reject(err);
      }
    };

    img.onerror = (err) => {
      console.warn('Image load error during avatar compression:', err);
      if (typeof source === 'string') resolve(source);
      else reject(new Error('تعذر تحميل الصورة لضغطها'));
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          img.src = reader.result;
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}

export async function compressCover(
  source: File | string,
  maxWidth = 800,
  maxHeight = 400,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof source === 'string' ? source : '');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (err) {
        console.warn('Cover compression error, falling back:', err);
        if (typeof source === 'string') resolve(source);
        else reject(err);
      }
    };

    img.onerror = (err) => {
      console.warn('Image load error during cover compression:', err);
      if (typeof source === 'string') resolve(source);
      else reject(new Error('تعذر تحميل صورة الغلاف'));
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          img.src = reader.result;
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}
