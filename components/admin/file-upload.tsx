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

// MODIFICATION: Update the onUploadComplete prop signature
interface FileUploadProps {
  label: string;
  uploadType: "image" | "file";
  acceptedFileTypes: string;
  helpText: string;
  onUploadComplete: (result: { url: string; publicId: string }) => void;
  onRemove: () => void;
  disabled?: boolean;
  initialUrl?: string | null;
  initialFileName?: string;
  maxSizeMb?: number;
}

interface UploadState {
  file: File | null;
  previewUrl: string | null;
  previewName: string | null;
  isUploading: boolean;
  isUploaded: boolean;
  progress: number;
}

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
  maxSizeMb = 10,
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
        // MODIFICATION: Capture the result object
        const uploadResult = await uploadFileWithProgress(
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
          previewUrl: uploadResult.url, // Update preview to the final URL
        }));

        // MODIFICATION: Pass the entire result object to the parent
        onUploadComplete(uploadResult);
        toast.success(`${label} uploaded successfully!`);
      } catch (error: any) {
        setUploadState({
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
    if (
      uploadState.file &&
      uploadType === "image" &&
      uploadState.previewUrl?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(uploadState.previewUrl);
    }

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
    onRemove();
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
            <p className="text-xs text-gray-400">{helpText}</p>
          </div>
        ) : (
          <div className="space-y-2">
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

          const MAX_FILE_SIZE_BYTES = maxSizeMb * 1024 * 1024;
          if (file.size > MAX_FILE_SIZE_BYTES) {
            toast.error(`File size cannot exceed ${maxSizeMb}MB.`);
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
