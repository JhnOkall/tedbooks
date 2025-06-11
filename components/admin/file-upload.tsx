/**
 * @file This file defines a reusable file upload component with progress tracking.
 * It encapsulates all logic related to selecting, uploading, and previewing a file,
 * including displaying an initial file for edit forms.
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Loader2,
  Image as ImageIcon,
  FileText,
  X,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { uploadFileWithProgress } from "@/lib/upload-utils";

// Props for our reusable component
interface FileUploadProps {
  label: string;
  uploadType: "image" | "file";
  acceptedFileTypes: string;
  helpText: string;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  initialUrl?: string | null;
  initialFileName?: string;
  maxSizeMb?: number; // <-- NEW: To enforce a file size limit, defaults to 10MB
}

interface UploadState {
  file: File | null;
  // This can be an object URL for new images, or the initial URL for existing ones
  previewUrl: string | null;
  // This is for displaying file names (e.g., "my-book.pdf")
  previewName: string | null;
  isUploading: boolean;
  isUploaded: boolean;
  progress: number;
}

/**
 * A reusable client component for handling file uploads with previews and progress.
 * Can display an initial file/image for edit forms and enforce a file size limit.
 */
export function FileUpload({
  label,
  uploadType,
  acceptedFileTypes,
  helpText,
  onUploadComplete,
  onRemove,
  disabled = false,
  initialUrl = null,
  initialFileName = "File",
  maxSizeMb = 10, // <-- NEW: Default max size set to 10MB
}: FileUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    previewUrl: initialUrl,
    previewName: initialFileName,
    isUploading: false,
    isUploaded: false,
    progress: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to update state if the initialUrl prop changes from the parent
  useEffect(() => {
    setUploadState((prev) => ({
      ...prev,
      previewUrl: initialUrl,
      previewName: initialFileName,
    }));
  }, [initialUrl, initialFileName]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      let previewUrl: string;
      let previewName: string;

      if (uploadType === "image") {
        previewUrl = URL.createObjectURL(file);
        previewName = file.name;
      } else {
        previewUrl = ""; // Not used for file-type previews
        previewName = `${file.name} (${(file.size / 1024 / 1024).toFixed(
          2
        )} MB)`;
      }

      setUploadState({
        file,
        previewUrl,
        previewName,
        isUploading: true,
        isUploaded: false,
        progress: 0,
      });

      try {
        const uploadedUrl = await uploadFileWithProgress(
          file,
          uploadType,
          (progress) => {
            setUploadState((prev) => ({ ...prev, progress }));
          }
        );

        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          isUploaded: true,
          previewUrl: uploadedUrl, // Update preview to the final URL
        }));

        onUploadComplete(uploadedUrl);
        toast.success(`${label} uploaded successfully!`);
      } catch (error: any) {
        setUploadState({
          // Revert on failure
          file: null,
          previewUrl: initialUrl,
          previewName: initialFileName,
          isUploading: false,
          isUploaded: false,
          progress: 0,
        });
        toast.error(
          `Failed to upload ${label.toLowerCase()}: ${error.message}`
        );
      }
    },
    [label, onUploadComplete, uploadType, initialUrl, initialFileName]
  );

  const removeFile = () => {
    // If we were displaying a new image preview, revoke its object URL
    if (
      uploadState.file &&
      uploadType === "image" &&
      uploadState.previewUrl?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(uploadState.previewUrl);
    }

    // Reset state back to the initial props
    setUploadState({
      file: null,
      previewUrl: initialUrl,
      previewName: initialFileName,
      isUploading: false,
      isUploaded: false,
      progress: 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onRemove(); // Notify parent that the change was reverted
  };

  const Icon = uploadType === "image" ? ImageIcon : FileText;
  const hasFile = !!uploadState.previewUrl || !!uploadState.file;

  return (
    <div className="space-y-2">
      <label className="font-medium text-sm">{label}</label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 transition-colors hover:border-gray-400">
        {!hasFile ? (
          <div
            className="flex flex-col items-center justify-center py-8 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Click to upload {label.toLowerCase()}
            </p>
            {/* UPDATED: Help text now shows the max size */}
            <p className="text-xs text-gray-400">
              {helpText} (Max: {maxSizeMb}MB)
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Preview Section */}
            {uploadType === "image" ? (
              <div className="relative">
                <Image
                  src={uploadState.previewUrl!}
                  alt="File preview"
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeFile}
                  disabled={uploadState.isUploading}
                  title="Remove or cancel upload"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-5 w-5 text-gray-600 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {uploadState.previewName}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  disabled={uploadState.isUploading}
                  title="Remove or cancel upload"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Upload Status Section */}
            {uploadState.isUploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    Uploading... {uploadState.progress.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadState.isUploaded && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">
                  New {label.toLowerCase()} uploaded
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          // <-- NEW: Enforce file size limit before handling the file
          const MAX_FILE_SIZE_BYTES = maxSizeMb * 1024 * 1024;
          if (file.size > MAX_FILE_SIZE_BYTES) {
            toast.error(`File size cannot exceed ${maxSizeMb}MB.`);
            // Reset the input so the user can select another file
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
            return;
          }

          handleFileSelect(file);
        }}
        disabled={disabled || uploadState.isUploading}
      />
    </div>
  );
}
