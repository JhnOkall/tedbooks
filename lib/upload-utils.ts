/**
 * @file This file contains utility functions for file uploads to Cloudinary using a signed upload flow,
 * with iLovePDF compression for PDF files.
 */
import { customAlphabet } from 'nanoid';
// NEW: Import the iLovePDF library
import ILovePDFApi from '@ilovepdf/ilovepdf-js';

// === NEW: Initialize the iLovePDF client ===
// The '!' asserts that the environment variable is defined. Ensure it is set.
const ilovepdf = new ILovePDFApi(process.env.NEXT_PUBLIC_ILOVEPDF_PUBLIC_KEY!);

const nanoid = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyz',
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
 * Compresses a PDF if applicable, then uploads a file directly to Cloudinary using a server-generated signature.
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
  // (This part remains the same)
  const folder = uploadType === 'image' ? 'book-covers' : 'book-files';
  const resource_type = uploadType === 'image' ? 'image' : 'raw';
  const originalFilenameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
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

  // This will hold the file to be uploaded. It starts as the original file.
  let fileToUpload: File | Blob = file;

  // === NEW: Step 1.5: Conditionally Compress PDF files ===
  if (uploadType === 'file' && file.type === 'application/pdf') {
    try {
      console.log('Starting PDF compression...');
      onProgress(15); // Update progress to show compression has started

      const task = ilovepdf.newTask('compress');
      await task.addFile(URL.createObjectURL(file));
      await task.process({ compression_level: 'recommended' });
      const compressedData = await task.download();
      const compressedBlob = new Blob([compressedData]);
      
      console.log(`PDF compression complete. Original: ${file.size}, Compressed: ${compressedBlob.size}`);
      fileToUpload = compressedBlob;
      onProgress(30); // Compression is done, ready for upload
    } catch (error) {
      console.error("iLovePDF compression failed:", error);
      // Fallback: If compression fails, we'll warn the user and upload the original file.
      // We don't need to do anything here since `fileToUpload` is still the original file.
      // We reset progress back to the post-signature state.
      onProgress(10);
    }
  }

  // === Step 2: Upload the file directly to Cloudinary using the signature ===
  const { signature, timestamp, api_key, cloud_name, resource_type: returnedResourceType, signed_params } = signatureResponse;
  const url = `https://api.cloudinary.com/v1_1/${cloud_name}/${returnedResourceType}/upload`;

  const formData = new FormData();
  // MODIFIED: Use the (potentially compressed) fileToUpload.
  // We provide the original filename as the third argument so Cloudinary uses it.
  formData.append('file', fileToUpload, file.name);
  formData.append('api_key', api_key);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', public_id);
  
  if (signed_params?.use_filename) {
    formData.append('use_filename', 'true');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    // MODIFIED: Adjust progress scaling to account for the compression step
    const uploadStartingProgress = (fileToUpload === file) ? 10 : 30;
    const uploadProgressRange = 100 - uploadStartingProgress;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(uploadStartingProgress + (progress * (uploadProgressRange / 100)));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        onProgress(100);
        const response = JSON.parse(xhr.responseText);
        resolve(response.secure_url);
      } else {
        const errorResponse = JSON.parse(xhr.responseText);
        console.error("Cloudinary upload error:", errorResponse);
        reject(new Error(errorResponse.error?.message || 'Upload failed.'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('An network error occurred during the upload.'));
    };

    xhr.send(formData);
  });
};