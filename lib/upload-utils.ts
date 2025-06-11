/**
 * @file This file contains utility functions for file uploads to Cloudinary using a signed, chunked upload flow.
 */
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyz',
  16
);
function slugify(text: string): string {
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

  // === Step 1: Get signature (no change here) ===
  const originalFilenameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
  const folder = uploadType === 'image' ? 'book-covers' : 'book-files';
  const resource_type = uploadType === 'image' ? 'image' : 'raw';
  const public_id = uploadType === 'image' ? nanoid() : slugify(originalFilenameWithoutExt);

  const signatureResponse = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, public_id, resource_type }),
  }).then(res => res.json());

  if (!signatureResponse.success) {
    throw new Error(signatureResponse.message || 'Failed to get upload signature.');
  }

  onProgress(5);

  // === Step 2: Set up for chunked upload ===
  const { signature, timestamp, api_key, cloud_name, resource_type: returnedResourceType, signed_params } = signatureResponse;
  
  // *** CHANGE #1: Build the base URL with all parameters as a query string ***
  const baseUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${returnedResourceType}/upload`;
  const url = new URL(baseUrl);
  url.searchParams.set('api_key', api_key);
  url.searchParams.set('timestamp', timestamp);
  url.searchParams.set('signature', signature);
  url.searchParams.set('public_id', public_id);
  url.searchParams.set('folder', folder);
  // Add any other signed parameters to the URL
  if (signed_params?.use_filename) {
    url.searchParams.set('use_filename', 'true');
  }

  const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB
  const totalSize = file.size;
  const uniqueUploadId = nanoid();
  
  // === Step 3: Sequentially upload chunks ===
  return new Promise((resolve, reject) => {
    const uploadChunk = (startByte: number) => {
      const endByte = Math.min(startByte + CHUNK_SIZE, totalSize);
      const chunk = file.slice(startByte, endByte);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url.toString(), true); // Use the URL with query params

      // Set headers required for chunked uploads
      xhr.setRequestHeader('X-Unique-Upload-Id', uniqueUploadId);
      xhr.setRequestHeader('Content-Range', `bytes ${startByte}-${endByte - 1}/${totalSize}`);
      // DO NOT set Content-Type; the browser will set it correctly for the blob/chunk.

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round(((startByte + event.loaded) / totalSize) * 100);
          onProgress(progress > 100 ? 100 : progress); // Cap progress at 100
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          if (endByte < totalSize) {
            uploadChunk(endByte);
          } else {
            const response = JSON.parse(xhr.responseText);
            onProgress(100);
            resolve(response.secure_url);
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            console.error("Cloudinary chunk upload error:", errorResponse);
            reject(new Error(errorResponse.error?.message || 'A part of the file failed to upload.'));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('An network error occurred during the upload.'));
      };

      // *** CHANGE #2: Send the raw chunk data as the body ***
      xhr.send(chunk);
    };

    // Start the upload process with the first chunk
    uploadChunk(0);
  });
};