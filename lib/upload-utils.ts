/**
 * @file This file contains utility functions for file uploads to Cloudinary using a signed, chunked upload flow.
 */
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyz',
  16
);

function slugify(text: string): string {
  // ... your existing slugify function remains the same ...
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(p, c => b.charAt(a.indexOf(c)))
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

/**
 * Uploads a file directly to Cloudinary using a signed, chunked upload flow.
 *
 * @param file The file to upload.
 * @param uploadType The type of upload ('image' or 'file') to determine Cloudinary settings.
 * @param onProgress A callback function to report upload progress (0-100).
 * @returns A promise that resolves to the secure URL of the uploaded file.
 */
export const uploadFileWithProgress = async (
  file: File,
  uploadType: 'image' | 'file',
  onProgress: (progress: number) => void
): Promise<string> => {
  onProgress(0);

  // === Step 1: Prepare upload parameters and get a signature from our API ===
  // This part is the same as before.
  const originalFilenameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
  
  const folder = uploadType === 'image' ? 'book-covers' : 'book-files';
  const resource_type = uploadType === 'image' ? 'image' : 'raw';
  const public_id = uploadType === 'image' ? nanoid() : slugify(originalFilenameWithoutExt);
    
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
  
  onProgress(5); // Signing is a small step now

  // === Step 2: Set up constants and variables for chunked upload ===
  const { signature, timestamp, api_key, cloud_name, resource_type: returnedResourceType } = signatureResponse;
  const url = `https://api.cloudinary.com/v1_1/${cloud_name}/${returnedResourceType}/upload`;

  // Use a chunk size of 6MB. Cloudinary's limit for raw files on the free plan is 10MB.
  // Using 6MB gives us a safe buffer.
  const CHUNK_SIZE = 6 * 1024 * 1024;
  const totalSize = file.size;
  const uniqueUploadId = nanoid(); // A unique ID for this specific file upload
  let start = 0;

  // === Step 3: Sequentially upload chunks ===
  return new Promise((resolve, reject) => {
    
    const uploadChunk = (startByte: number) => {
      const endByte = Math.min(startByte + CHUNK_SIZE, totalSize);
      const chunk = file.slice(startByte, endByte);
      
      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('api_key', api_key);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);
      formData.append('public_id', public_id);
      
      // `use_filename` is only for 'raw' types and must be signed.
      if (resource_type === 'raw') {
        formData.append('use_filename', 'true');
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);

      // Set headers required for chunked uploads
      xhr.setRequestHeader('X-Unique-Upload-Id', uniqueUploadId);
      xhr.setRequestHeader('Content-Range', `bytes ${startByte}-${endByte - 1}/${totalSize}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          // Calculate progress based on chunks uploaded so far + progress of the current chunk
          const progress = Math.round(((startByte + event.loaded) / totalSize) * 100);
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);

          // If there are more chunks to upload, start the next one
          if (endByte < totalSize) {
            uploadChunk(endByte);
          } else {
            // This was the last chunk, the upload is complete
            onProgress(100);
            resolve(response.secure_url);
          }
        } else {
          const errorResponse = JSON.parse(xhr.responseText);
          console.error("Cloudinary chunk upload error:", errorResponse);
          reject(new Error(errorResponse.error?.message || 'A part of the file failed to upload.'));
        }
      };

      xhr.onerror = () => {
        reject(new Error('An network error occurred during the upload. Please check your connection.'));
      };

      xhr.send(formData);
    };

    // Start the upload process with the first chunk
    uploadChunk(0);
  });
};