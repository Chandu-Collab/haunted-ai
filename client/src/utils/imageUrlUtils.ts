// Utility functions for handling image URLs, especially blob URLs

export const validateImageUrl = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

export const isBlobUrl = (url: string): boolean => {
  return url.startsWith('blob:');
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const getImageInfo = (url: string) => {
  return {
    isBlob: isBlobUrl(url),
    isValid: isValidUrl(url),
    type: url.startsWith('blob:') 
      ? 'local' 
      : url.startsWith('/') 
        ? 'server' 
        : url.startsWith('http') 
          ? 'external' 
          : 'unknown'
  };
};

// Function to convert File to base64 data URL (more reliable than blob URLs)
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};