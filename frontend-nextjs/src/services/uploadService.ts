import { api } from './api';

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

export interface UploadResponse {
  success: boolean;
  data: UploadedFile;
  message: string;
}

export interface MultipleUploadResponse {
  success: boolean;
  data: UploadedFile[];
  message: string;
}

export const uploadService = {
  // Upload a single file
  async uploadFile(file: File, folder: string = 'general'): Promise<UploadedFile> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await api.post<UploadResponse>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload file');
    }
  },

  // Upload multiple files
  async uploadFiles(files: File[], folder: string = 'general'): Promise<UploadedFile[]> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('folder', folder);

      const response = await api.post<MultipleUploadResponse>('/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload files');
    }
  },

  // Upload image with automatic optimization
  async uploadImage(file: File, folder: string = 'images', maxWidth?: number, maxHeight?: number): Promise<UploadedFile> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      if (maxWidth) formData.append('maxWidth', maxWidth.toString());
      if (maxHeight) formData.append('maxHeight', maxHeight.toString());

      const response = await api.post<UploadResponse>('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload image');
    }
  },

  // Delete uploaded file
  async deleteFile(fileId: string): Promise<void> {
    try {
      await api.delete(`/upload/${fileId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete file');
    }
  },

  // Get file info
  async getFileInfo(fileId: string): Promise<UploadedFile> {
    try {
      const response = await api.get<UploadResponse>(`/upload/${fileId}`);
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get file info');
    }
  },

  // Validate file before upload
  validateFile(file: File, options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    maxWidth?: number;
    maxHeight?: number;
  } = {}): { isValid: boolean; error?: string } {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    } = options;

    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size must be less than ${this.formatFileSize(maxSize)}`
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type must be one of: ${allowedTypes.join(', ')}`
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
        // Calculate new dimensions
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

        // Draw and compress
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

  // Get upload progress (for future implementation with progress tracking)
  onUploadProgress(callback: (progress: number) => void) {
    // This would be implemented with axios upload progress
    // For now, it's a placeholder
    return callback;
  }
};
