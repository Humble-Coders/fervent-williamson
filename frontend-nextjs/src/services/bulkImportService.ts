import { apiClient } from './api';
import { logger } from '@/config/logger';
import { env } from '../config/env';

export interface BulkImportProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  startedAt?: string;
  completedAt?: string;
  estimatedTimeRemaining?: number;
  progressPercentage: number;
}

export interface BulkImportResponse {
  jobId: string;
  bullJobId: string;
  message: string;
  estimatedTime: string;
}

class BulkImportService {
  private baseUrl = `${env.API_URL}/bulk-import`;

  constructor() {
    logger.info('🔧 BulkImportService initialized');
    logger.info('🔗 API_URL:', env.API_URL);
    logger.info('🔗 Base URL:', this.baseUrl);
  }

  /**
   * Upload CSV/Excel file for bulk service creation
   */
  async importServices(file: File): Promise<BulkImportResponse> {
    try {
      logger.info('🔄 Starting bulk import services...');
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(`${this.baseUrl}/services`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      logger.info('✅ Bulk import services started:', (response as any).data?.data);
      return (response as any).data?.data;
    } catch (error) {
      logger.error('❌ Error starting bulk import services:', error);
      throw error;
    }
  }

  /**
   * Upload CSV/Excel file for bulk stylist creation
   */
  async importStylists(file: File): Promise<BulkImportResponse> {
    try {
      logger.info('🔄 Starting bulk import stylists...');

      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(`${this.baseUrl}/stylists`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      logger.info('✅ Bulk import stylists started:', (response as any).data?.data);
      return (response as any).data?.data;
    } catch (error) {
      logger.error('❌ Error starting bulk import stylists:', error);
      throw error;
    }
  }

  /**
   * Upload CSV/Excel file for bulk service category creation
   */
  async importServiceCategories(file: File): Promise<BulkImportResponse> {
    try {
      logger.info('🔄 Starting bulk import service categories...');

      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(`${this.baseUrl}/service-categories`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      logger.info('✅ Bulk import service categories started:', (response as any).data?.data);
      return (response as any).data?.data;
    } catch (error) {
      logger.error('❌ Error starting bulk import service categories:', error);
      throw error;
    }
  }

  /**
   * Get import progress
   */
  async getImportProgress(jobId: string): Promise<BulkImportProgress> {
    try {
      logger.info('🔄 Getting import progress:', jobId);
      
      const response = await apiClient.get(`${this.baseUrl}/progress/${jobId}`);
      
      logger.info('📊 Import progress:', (response as any).data?.data);
      return (response as any).data?.data;
    } catch (error) {
      logger.error('❌ Error getting import progress:', error);
      throw error;
    }
  }

  /**
   * Download services CSV template
   */
  async downloadServicesTemplate(templateType: 'name' | 'displayId' = 'name'): Promise<Blob> {
    try {
      logger.info('🔄 Downloading services template...', { templateType });

      // Use fetch directly to avoid axios interceptor issues
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Accept': 'text/csv',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${this.baseUrl}/template/services?type=${templateType}`;
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      logger.info('✅ Services template response status:', response.status);
      logger.info('✅ Services template response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      logger.info('✅ Services template text length:', text.length);

      // Validate that we received text data
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid response format received - expected text data');
      }

      // Convert text to blob with proper CSV MIME type
      const blob = new Blob([text], {
        type: 'text/csv;charset=utf-8'
      });
      logger.info('✅ Created blob, size:', { size: blob.size, type: blob.type });

      return blob;
    } catch (error: any) {
      logger.error('❌ Error downloading services template:', error);

      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;

        if (status === 401) {
          throw new Error('Please log in to download the template');
        } else if (status === 403) {
          throw new Error('Access denied. Salon owner role required to download templates');
        } else if (status === 404) {
          throw new Error('Template endpoint not found. Please contact support');
        } else {
          // Try to extract error message from response
          let errorMessage = 'Failed to download template';

          if (error.response.data instanceof Blob) {
            // If error response is a blob, try to read it as text
            try {
              const text = await error.response.data.text();
              const errorData = JSON.parse(text);
              errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
              logger.error('Could not parse error response:', parseError);
            }
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          }

          throw new Error(errorMessage);
        }
      } else if (error.request) {
        // Network error
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        // Other error
        throw new Error(error.message || 'Failed to download template');
      }
    }
  }

  /**
   * Download service categories CSV template
   */
  async downloadServiceCategoriesTemplate(): Promise<Blob> {
    try {
      logger.info('🔄 Downloading service categories template...');

      // Use fetch directly to avoid axios interceptor issues
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Accept': 'text/csv',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/template/service-categories-import`, {
        method: 'GET',
        headers,
      });

      logger.info('✅ Service categories template response status:', response.status);
      logger.info('✅ Service categories template response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      logger.info('✅ Service categories template text length:', text.length);

      // Validate that we received text data
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid response format received - expected text data');
      }

      // Convert text to blob with proper CSV MIME type
      const blob = new Blob([text], {
        type: 'text/csv;charset=utf-8'
      });
      logger.info('✅ Created blob, size:', { size: blob.size, type: blob.type });

      return blob;
    } catch (error: any) {
      logger.error('❌ Error downloading service categories template:', error);

      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;

        if (status === 401) {
          throw new Error('Please log in to download the template');
        } else if (status === 403) {
          throw new Error('Access denied. Salon owner or admin role required to download templates');
        } else if (status === 404) {
          throw new Error('Template endpoint not found. Please contact support');
        } else {
          // Try to extract error message from response
          let errorMessage = 'Failed to download template';

          if (error.response.data instanceof Blob) {
            // If error response is a blob, try to read it as text
            try {
              const text = await error.response.data.text();
              const errorData = JSON.parse(text);
              errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
              logger.error('Could not parse error response:', parseError);
            }
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          }

          throw new Error(errorMessage);
        }
      } else if (error.request) {
        // Network error
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        // Other error
        throw new Error(error.message || 'Failed to download template');
      }
    }
  }

  /**
   * Download stylists CSV template
   */
  async downloadStylistsTemplate(templateType: 'name' | 'displayId' = 'name'): Promise<Blob> {
    try {
      logger.info('🔄 Downloading stylists template...', { templateType });

      // Use fetch directly to avoid axios interceptor issues
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Accept': 'text/csv',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${this.baseUrl}/template/stylists?type=${templateType}`;
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      logger.info('✅ Stylists template response status:', response.status);
      logger.info('✅ Stylists template response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      logger.info('✅ Stylists template text length:', text.length);

      // Validate that we received text data
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid response format received - expected text data');
      }

      // Convert text to blob with proper CSV MIME type
      const blob = new Blob([text], {
        type: 'text/csv;charset=utf-8'
      });
      logger.info('✅ Created blob, size:', { size: blob.size, type: blob.type });

      return blob;
    } catch (error: any) {
      logger.error('❌ Error downloading stylists template:', error);

      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;

        if (status === 401) {
          throw new Error('Please log in to download the template');
        } else if (status === 403) {
          throw new Error('Access denied. Salon owner role required to download templates');
        } else if (status === 404) {
          throw new Error('Template endpoint not found. Please contact support');
        } else {
          // Try to extract error message from response
          let errorMessage = 'Failed to download template';

          if (error.response.data instanceof Blob) {
            // If error response is a blob, try to read it as text
            try {
              const text = await error.response.data.text();
              const errorData = JSON.parse(text);
              errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
              logger.error('Could not parse error response:', parseError);
            }
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          }

          throw new Error(errorMessage);
        }
      } else if (error.request) {
        // Network error
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        // Other error
        throw new Error(error.message || 'Failed to download template');
      }
    }
  }

  /**
   * Download service categories reference CSV
   */
  async downloadServiceCategoriesReference(): Promise<Blob> {
    try {
      logger.info('🔄 Downloading service categories reference...');

      // Use fetch directly to avoid axios interceptor issues
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Accept': 'text/csv',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/template/service-categories`, {
        method: 'GET',
        headers,
      });

      logger.info('✅ Service categories reference response status:', response.status);
      logger.info('✅ Service categories reference response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      logger.info('✅ Service categories reference text length:', text.length);

      // Validate that we received text data
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid response format received - expected text data');
      }

      // Convert text to blob with proper CSV MIME type
      const blob = new Blob([text], {
        type: 'text/csv;charset=utf-8'
      });
      logger.info('✅ Created blob, size:', { size: blob.size, type: blob.type });

      return blob;
    } catch (error: any) {
      logger.error('❌ Error downloading service categories reference:', error);

      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        if (status === 401) {
          throw new Error('Authentication required. Please log in and try again.');
        } else if (status === 403) {
          throw new Error('Access denied. You need appropriate permissions to download templates.');
        } else if (status === 404) {
          throw new Error('Template endpoint not found. Please contact support.');
        } else {
          throw new Error(`Server error (${status}): ${error.response.statusText || 'Unknown error'}`);
        }
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // Network error
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        // Other errors
        throw new Error(error.message || 'Failed to download service categories reference');
      }
    }
  }

  /**
   * Clean up import progress data
   */
  async cleanupImportProgress(jobId: string): Promise<void> {
    try {
      logger.info('🔄 Cleaning up import progress:', jobId);
      
      await apiClient.delete(`${this.baseUrl}/cleanup/${jobId}`);
      
      logger.info('✅ Import progress cleaned up');
    } catch (error) {
      logger.error('❌ Error cleaning up import progress:', error);
      throw error;
    }
  }

  /**
   * Helper method to download template as file
   */
  async downloadTemplateAsFile(blob: Blob, filename: string): Promise<void> {
    try {
      logger.info('🔍 === DOWNLOAD DEBUG START ===');
      logger.info('📥 Starting file download...');
      logger.info('📄 Original filename:', filename);
      logger.info('📄 Original filename type:', typeof filename);
      logger.info('📄 Original filename length:', filename.length);
      logger.info('📄 Original filename ends with .csv?', filename.endsWith('.csv'));
      logger.info('📦 Blob size:', blob.size);
      logger.info('📦 Blob type:', blob.type);

      // Validate that we have a proper blob
      if (!(blob instanceof Blob)) {
        throw new Error('Invalid file data received');
      }

      // Ensure filename has .csv extension
      if (!filename.endsWith('.csv')) {
        const oldFilename = filename;
        filename = filename.replace(/\.[^/.]+$/, '') + '.csv';
        logger.info('🔧 Modified filename from:', { oldFilename, to: filename });
      } else {
        logger.info('✅ Filename already has .csv extension');
      }

      logger.info('📄 Final filename after extension check:', filename);
      logger.info('📄 Final filename type:', typeof filename);
      logger.info('📄 Final filename length:', filename.length);

      // Method 1: Try modern download API if available
      if ('showSaveFilePicker' in window) {
        logger.info('🆕 Using modern File System Access API');
        try {
          await this.downloadWithFileSystemAPI(blob, filename);
          return;
        } catch (error) {
          logger.info('🔄 File System Access API failed, falling back to standard method');
          // Continue to fallback methods below
        }
      }

      // Method 2: IE/Edge legacy support
      if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
        logger.info('🌐 Using IE/Edge download method');
        (window.navigator as any).msSaveOrOpenBlob(blob, filename);
        return;
      }

      // Method 3: Standard download with enhanced compatibility
      logger.info('🔗 Using standard download method');
      logger.info('🔍 === STANDARD DOWNLOAD DEBUG ===');
      logger.info('📄 Input filename to standard method:', filename);

      // Ensure filename has .csv extension
      let finalFilename = filename;
      logger.info('📄 Before extension check - finalFilename:', finalFilename);
      logger.info('📄 Does finalFilename end with .csv?', finalFilename.toLowerCase().endsWith('.csv'));

      if (!finalFilename.toLowerCase().endsWith('.csv')) {
        const beforeChange = finalFilename;
        finalFilename = finalFilename + '.csv';
        logger.info('🔧 EXTENSION ADDED - Before:', { beforeChange, after: finalFilename });
      } else {
        logger.info('✅ Extension already present, no change needed');
      }

      logger.info('📄 Final download filename after all checks:', finalFilename);
      logger.info('📄 Final filename length:', finalFilename.length);
      logger.info('📄 Final filename type:', typeof finalFilename);

      // Create a new blob with explicit CSV headers and BOM for better compatibility
      const BOM = '\uFEFF'; // UTF-8 BOM for better Excel compatibility
      const csvContent = BOM + (blob instanceof Blob ? await blob.text() : blob);
      const csvBlob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8'
      });

      const url = window.URL.createObjectURL(csvBlob);
      logger.info('🔗 Created object URL:', url);

      // Create download link with enhanced attributes
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      link.setAttribute('download', finalFilename);
      link.setAttribute('type', 'text/csv');
      link.setAttribute('target', '_blank');
      link.style.display = 'none';
      link.style.position = 'absolute';
      link.style.left = '-9999px';

      logger.info('🔍 === LINK ATTRIBUTES DEBUG ===');
      logger.info('🔗 link.href:', link.href);
      logger.info('📄 link.download:', link.download);
      logger.info('📄 link.getAttribute("download"):', link.getAttribute('download'));
      logger.info('📄 link.getAttribute("type"):', link.getAttribute('type'));

      // Add to DOM and trigger download
      document.body.appendChild(link);
      logger.info('🔍 === BEFORE CLICK DEBUG ===');
      logger.info('📄 Final link.download before click:', link.download);
      logger.info('📄 Final link.getAttribute("download") before click:', link.getAttribute('download'));
      logger.info('🔗 Link added to DOM, href:', link.href);

      logger.info('🖱️ Triggering download...');

      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        logger.info('🔍 === INSIDE CLICK HANDLER ===');
        logger.info('📄 link.download at click time:', link.download);
        logger.info('📄 link.getAttribute("download") at click time:', link.getAttribute('download'));

        link.click();
        logger.info('✅ Primary click executed');

        // Fallback click after short delay
        setTimeout(() => {
          try {
            logger.info('🔍 === FALLBACK CLICK ===');
            logger.info('📄 link.download at fallback time:', link.download);

            const event = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            });
            link.dispatchEvent(event);
            logger.info('✅ Fallback click executed');
          } catch (e) {
            logger.info('❌ Fallback click failed:', e);
          }
        }, 100);

        // Clean up after longer delay
        setTimeout(() => {
          try {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
            window.URL.revokeObjectURL(url);
            logger.info('🧹 Cleaned up download resources');
          } catch (e) {
            logger.info('Cleanup completed with minor issues');
          }
        }, 2000);
      });

      logger.info('✅ Download initiated successfully');
    } catch (error) {
      logger.error('❌ Error downloading file:', error);
      throw new Error('Failed to download file. Please try again.');
    }
  }

  /**
   * Modern File System Access API download method
   */
  private async downloadWithFileSystemAPI(blob: Blob, filename: string): Promise<void> {
    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'CSV files',
          accept: { 'text/csv': ['.csv'] }
        }]
      });

      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      logger.info('✅ File saved using File System Access API');
    } catch (error) {
      logger.info('🔄 File System Access API failed, falling back to standard method');
      throw error; // Re-throw to trigger fallback in calling method
    }
  }

  /**
   * Alternative download method using data URL
   */
  downloadTemplateAsFileAlternative(blob: Blob, filename: string): void {
    try {
      logger.info('📥 Using alternative download method (Data URL)...');
      logger.info('📄 Filename:', filename);

      // Ensure filename has .csv extension
      if (!filename.endsWith('.csv')) {
        filename = filename.replace(/\.[^/.]+$/, '') + '.csv';
      }

      // Convert blob to data URL
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const dataUrl = reader.result as string;
          logger.info('📄 Created data URL, length:', dataUrl.length);

          // Create download link with data URL
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = filename;
          link.setAttribute('download', filename);
          link.style.display = 'none';
          link.style.position = 'absolute';
          link.style.left = '-9999px';

          // Add to DOM and click
          document.body.appendChild(link);

          // Multiple click attempts
          link.click();

          // Fallback clicks
          setTimeout(() => link.click(), 50);
          setTimeout(() => link.click(), 100);

          // Cleanup
          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
            logger.info('✅ Alternative download completed (Data URL)');
          }, 1000);

        } catch (error) {
          logger.error('❌ Data URL download failed:', error);
          throw error;
        }
      };

      reader.onerror = () => {
        logger.error('❌ FileReader failed');
        throw new Error('Failed to read blob data');
      };

      // Read blob as data URL
      reader.readAsDataURL(blob);

    } catch (error) {
      logger.error('❌ Alternative download failed:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size must be less than 10MB'
      };
    }

    // Check file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: 'Only CSV and Excel files (.csv, .xlsx, .xls) are allowed'
      };
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format estimated time remaining
   */
  formatEstimatedTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Simple fallback download method
   */
  downloadTemplateAsFileFallback(blob: Blob, filename: string): void {
    try {
      logger.info('📥 Using fallback download method...');

      // Ensure filename has .csv extension
      if (!filename.endsWith('.csv')) {
        filename = filename.replace(/\.[^/.]+$/, '') + '.csv';
      }

      // Create a simple download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      // Set all possible attributes
      link.href = url;
      link.download = filename;
      link.setAttribute('download', filename);
      link.setAttribute('type', 'text/csv');
      link.style.display = 'none';

      // Add to DOM
      document.body.appendChild(link);

      // Force download
      link.click();

      // Immediate cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      logger.info('✅ Fallback download completed');
    } catch (error) {
      logger.error('❌ Fallback download failed:', error);
      throw error;
    }
  }

  /**
   * Manual download method - creates a new window with the CSV content
   */
  downloadTemplateAsFileManual(blob: Blob, filename: string): void {
    try {
      logger.info('📥 Using manual download method...');

      // Ensure filename has .csv extension
      if (!filename.endsWith('.csv')) {
        filename = filename.replace(/\.[^/.]+$/, '') + '.csv';
      }

      // Read blob as text
      const reader = new FileReader();
      reader.onload = () => {
        const csvContent = reader.result as string;

        // Create a new window with the CSV content
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>Download ${filename}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  .download-info { background: #f0f8ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                  .csv-content { background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap; font-family: monospace; }
                  .download-btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 5px; }
                  .download-btn:hover { background: #0056b3; }
                </style>
              </head>
              <body>
                <div class="download-info">
                  <h2>CSV Template: ${filename}</h2>
                  <p>Your browser couldn't download the file automatically. You can:</p>
                  <button class="download-btn" onclick="downloadFile()">Try Download Again</button>
                  <button class="download-btn" onclick="copyToClipboard()">Copy to Clipboard</button>
                  <p><small>Or manually copy the content below and save it as a .csv file</small></p>
                </div>
                <div class="csv-content" id="csvContent">{csvContent}</div>

                <script>
                  function downloadFile() {
                    const blob = new Blob([\`${csvContent}\`], { type: 'text/csv;charset=utf-8' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = '${filename}';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }

                  function copyToClipboard() {
                    const content = document.getElementById('csvContent').textContent;
                    navigator.clipboard.writeText(content).then(() => {
                      alert('CSV content copied to clipboard!');
                    }).catch(() => {
                      // Fallback for older browsers
                      const textArea = document.createElement('textarea');
                      textArea.value = content;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      alert('CSV content copied to clipboard!');
                    });
                  }
                </script>
              </body>
            </html>
          `);
          newWindow.document.close();
        } else {
          throw new Error('Could not open new window for manual download');
        }
      };

      reader.onerror = () => {
        throw new Error('Failed to read blob content');
      };

      reader.readAsText(blob);

      logger.info('✅ Manual download window opened');
    } catch (error) {
      logger.error('❌ Manual download failed:', error);
      throw error;
    }
  }

  /**
   * Download template with single reliable method
   */
  async downloadTemplateWithFallbacks(blob: Blob, filename: string): Promise<void> {
    try {
      logger.info(`🔄 Downloading ${filename}...`);

      // Use the most reliable method - create download link and click it
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);

      logger.info(`✅ Successfully downloaded ${filename}`);
    } catch (error) {
      logger.error(`❌ Download failed for ${filename}:`, error);
      throw new Error(`Failed to download ${filename}: ${(error as Error).message}`);
    }
  }

  /**
   * TEST METHOD - Download template without authentication
   */
  async downloadTestTemplate(type: 'services' | 'stylists', templateType: 'name' | 'displayId' = 'name'): Promise<Blob> {
    try {
      logger.info(`🧪 Downloading test ${type} template...`, { templateType });
      logger.info(`🔗 Request URL: ${this.baseUrl}/test/template/${type}`);

      // Try with a simple fetch first to debug
      const url = type === 'stylists'
        ? `${this.baseUrl}/test/template/${type}?type=${templateType}`
        : `${this.baseUrl}/test/template/${type}`;
      logger.info(`🌐 Full URL: ${url}`);

      try {
        const fetchResponse = await fetch(url);
        logger.info('🔍 Fetch response status:', fetchResponse.status);
        logger.info('🔍 Fetch response headers:', Object.fromEntries(fetchResponse.headers.entries()));

        if (!fetchResponse.ok) {
          throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
        }

        const text = await fetchResponse.text();
        logger.info('🔍 Fetch response text length:', text.length);
        logger.info('🔍 Fetch response text preview:', { preview: text.substring(0, 100) });

        // Convert text to blob with proper CSV MIME type
        const blob = new Blob([text], {
          type: 'text/csv;charset=utf-8'
        });
        logger.info('✅ Created blob, size:', { size: blob.size, type: blob.type });

        return blob;
      } catch (fetchError) {
        logger.error('❌ Fetch failed, trying axios:', fetchError);

        // Fallback to axios
        const response = await apiClient.get(`${this.baseUrl}/test/template/${type}`, {
          responseType: 'text',
        });

        logger.info(`✅ Axios ${type} template downloaded, type:`, typeof response.data);
        logger.info('✅ Axios response data length:', (response as any).data?.length);
        logger.info('✅ Axios response headers:', (response as any).headers);

        // Validate that we received text data
        if (!response.data || typeof response.data !== 'string') {
          throw new Error('Invalid response format received - expected text data');
        }

        // Convert text to blob
        const blob = new Blob([response.data], { type: 'text/csv' });
        logger.info('✅ Created blob, size:', blob.size);

        return blob;
      }
    } catch (error: any) {
      logger.error(`❌ Error downloading test ${type} template:`, error);
      throw new Error(error.message || `Failed to download test ${type} template`);
    }
  }

  /**
   * Download combined services and sub-services reference CSV for stylists
   */
  async downloadServicesAndSubServicesReference(): Promise<Blob> {
    try {
      logger.info('🔄 Downloading services and sub-services reference...');

      // Use fetch directly to avoid axios interceptor issues
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Accept': 'text/csv',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/export/services-and-subservices`, {
        method: 'GET',
        headers,
      });

      logger.info('✅ Services and sub-services reference response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      logger.info('✅ Services and sub-services reference text length:', text.length);

      // Validate that we received text data
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid response format received - expected text data');
      }

      // Convert text to blob with proper CSV MIME type
      const blob = new Blob([text], {
        type: 'text/csv;charset=utf-8'
      });
      logger.info('✅ Created blob, size:', { size: blob.size, type: blob.type });

      return blob;
    } catch (error: any) {
      logger.error('❌ Error downloading services and sub-services reference:', error);
      throw new Error(error.message || 'Failed to download services and sub-services reference');
    }
  }
}

export const bulkImportService = new BulkImportService();
