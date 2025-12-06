/**
 * imgBB Image Upload Service
 * Handles profile picture uploads to imgBB
 */

const IMGBB_API_KEY = 'cfe7185111917029d548b5462fb64d51';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

/**
 * Upload image to imgBB
 * @param {File} imageFile - The image file to upload
 * @returns {Promise<Object>} - Returns the upload response with image URL
 */
export const uploadImageToImgBB = async (imageFile) => {
  try {
    // Validate file
    if (!imageFile) {
      throw new Error('No image file provided');
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
      throw new Error('Invalid image type. Please upload JPEG, PNG, GIF, or WebP images.');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (imageFile.size > maxSize) {
      throw new Error('Image size too large. Maximum size is 10MB.');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', imageFile);

    // Upload to imgBB
    const response = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload image');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Image upload failed');
    }

    // Return image data
    return {
      success: true,
      imageUrl: data.data.url,
      thumbnailUrl: data.data.thumb?.url || data.data.url,
      displayUrl: data.data.display_url || data.data.url,
      deleteUrl: data.data.delete_url,
      imageId: data.data.id,
    };
  } catch (error) {
    console.error('imgBB upload error:', error);
    throw error;
  }
};

/**
 * Convert file to base64 (alternative method if needed)
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};








