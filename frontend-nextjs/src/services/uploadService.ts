import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase';

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  path: string;
  uploadedAt: string;
}

export const uploadService = {
  // Upload a single file
  async uploadFile(file: File, folder: string = 'general'): Promise<UploadedFile> {
    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `${folder}/${timestamp}_${safeName}`;
      const storageRef = ref(storage, path);

      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });

      const url = await getDownloadURL(snapshot.ref);

      return {
        id: path,
        filename: safeName,
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
        url,
        path,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload file');
    }
  },

  // Upload multiple files
  async uploadFiles(files: File[], folder: string = 'general'): Promise<UploadedFile[]> {
    try {
      const results = await Promise.all(
        files.map((file) => this.uploadFile(file, folder))
      );
      return results;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload files');
    }
  },

  // Upload image with automatic optimization
  async uploadImage(file: File, folder: string = 'images'): Promise<UploadedFile> {
    try {
      // Optionally compress before upload
      let fileToUpload = file;
      if (file.size > 2 * 1024 * 1024) {
        // Compress images over 2MB
        fileToUpload = await this.compressImage(file);
      }
      return this.uploadFile(fileToUpload, folder);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload image');
    }
  },

  // Delete uploaded file
  async deleteFile(filePath: string): Promise<void> {
    try {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete file');
    }
  },

  // Get file info (returns URL for a path)
  async getFileInfo(filePath: string): Promise<UploadedFile> {
    try {
      const storageRef = ref(storage, filePath);
      const url = await getDownloadURL(storageRef);

      return {
        id: filePath,
        filename: filePath.split('/').pop() || '',
        originalName: filePath.split('/').pop() || '',
        mimetype: 'application/octet-stream',
        size: 0,
        url,
        path: filePath,
        uploadedAt: '',
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get file info');
    }
  },

  // Validate file before upload
  validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}): { isValid: boolean; error?: string } {
    const {
      maxSize = 10 * 1024 * 1024,
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    } = options;

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size must be less than ${this.formatFileSize(maxSize)}`,
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type must be one of: ${allowedTypes.join(', ')}`,
      };
    }

    return { isValid: true };
  },

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file extension from filename
  getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  },

  // Check if file is an image
  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  },

  // Create preview URL for file
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  },

  // Revoke preview URL to free memory
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  },

  // Compress image before upload (client-side)
  async compressImage(file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  },

  // Upload progress placeholder
  onUploadProgress(callback: (progress: number) => void) {
    return callback;
  },
};
