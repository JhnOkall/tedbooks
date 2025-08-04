/**
 * @file This file contains utility functions for file uploads to Cloudinary using a signed upload flow.
 */
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyz', // Using lowercase only for cleaner URLs
  16
);

function slugify(text: string): string {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return text.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}


/**
 * Uploads a file directly to Cloudinary using a server-generated signature.
 *
 * @param file The file to upload.
 * @param uploadType The type of upload ('image' or 'file') to determine Cloudinary settings.
 * @param onProgress A callback function to report upload progress (0-100).
 * @returns A promise that resolves to an object with the secure URL and public ID of the uploaded file.
 */
export const uploadFileWithProgress = async (
  file: File,
  uploadType: 'image' | 'file',
  onProgress: (progress: number) => void
): Promise<{ url: string; publicId: string }> => { // MODIFICATION: Changed return type
  onProgress(0);

  // === Step 1: Prepare upload parameters and get a signature from our API ===
  const fileExtension = file.name.split('.').pop() || '';
  const originalFilenameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
  
  const folder = uploadType === 'image' ? 'book-covers' : 'book-files';
  const resource_type = uploadType === 'image' ? 'image' : 'raw'; // 'raw' is for non-image files like PDF/EPUB

  // Create a unique public_id. For books, we use a slug; for images, a random ID.
  const public_id = uploadType === 'image' 
    ? nanoid() 
    : slugify(originalFilenameWithoutExt);
    
  let signatureResponse;
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, public_id, resource_type }),
    });
    signatureResponse = await res.json();

    if (!res.ok || !signatureResponse.success) {
      throw new Error(signatureResponse.message || 'Failed to get upload signature.');
    }
  } catch (error) {
    console.error("Signature fetch error:", error);
    throw new Error('Could not prepare the file for upload. Please try again.');
  }
  
  onProgress(10); // Indicate that signing is complete

  // === Step 2: Upload the file directly to Cloudinary using the signature ===
  const { signature, timestamp, api_key, cloud_name, resource_type: returnedResourceType, signed_params } = signatureResponse;
  const url = `https://api.cloudinary.com/v1_1/${cloud_name}/${returnedResourceType}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', api_key);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', public_id);
  
  // Only append parameters that were included in the signature
  if (signed_params?.use_filename) {
    formData.append('use_filename', 'true');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    // Monitor upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        // We scale progress from 10% to 100% to account for the signing step
        onProgress(10 + (progress * 0.9));
      }
    };

    // Handle completion
    xhr.onload = () => {
      if (xhr.status === 200) {
        onProgress(100);
        const response = JSON.parse(xhr.responseText);
        // MODIFICATION: Resolve with an object containing both URL and public_id
        resolve({ url: response.secure_url, publicId: response.public_id });
      } else {
        const errorResponse = JSON.parse(xhr.responseText);
        console.error("Cloudinary upload error:", errorResponse);
        reject(new Error(errorResponse.error?.message || 'Upload failed.'));
      }
    };

    // Handle errors
    xhr.onerror = () => {
      reject(new Error('An network error occurred during the upload.'));
    };

    xhr.send(formData);
  });
};