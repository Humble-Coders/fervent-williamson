'use client';

import React, { useState, useRef, useEffect } from 'react';
import { logger } from '@/config/logger';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, Clock, Loader } from 'lucide-react';
import Button from './Button';
import { bulkImportService, BulkImportProgress } from '../../services/bulkImportService';
import { toast } from 'react-hot-toast';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importType: 'services' | 'stylists' | 'service-categories';
  onImportComplete?: () => void;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  importType,
  onImportComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<BulkImportProgress | null>(null);
  const [polling, setPolling] = useState(false);
  const [templateType, setTemplateType] = useState<'name' | 'displayId'>('name');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const title = importType === 'services'
    ? 'Bulk Import Services'
    : importType === 'stylists'
    ? 'Bulk Import Stylists'
    : 'Bulk Import Service Categories';
  const getTemplateName = () => {
    switch (importType) {
      case 'services':
        return templateType === 'displayId' ? 'services-import-template-displayid.csv' : 'services-import-template.csv';
      case 'stylists':
        return 'stylists-import-template.csv';
      case 'service-categories':
        return 'service-categories-import-template.csv';
      default:
        return 'template.csv';
    }
  };

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = bulkImportService.validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handle file drop
  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const validation = bulkImportService.validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      // Try the authenticated endpoint first, fallback to test endpoint
      let blob: Blob;
      try {
        switch (importType) {
          case 'services':
            blob = await bulkImportService.downloadServicesTemplate(templateType);
            break;
          case 'stylists':
            blob = await bulkImportService.downloadStylistsTemplate(templateType);
            break;
          case 'service-categories':
            blob = await bulkImportService.downloadServiceCategoriesTemplate();
            break;
          default:
            throw new Error(`Unknown import type: ${importType}`);
        }
      } catch (authError: unknown) {
        logger.info('🧪 Auth failed, trying test endpoint:', (authError as Error).message);
        toast('Using test template (authentication required for full access)', {
          icon: 'ℹ️',
          duration: 4000,
        });

        // Fallback to test endpoint
        if (importType === 'service-categories') {
          throw new Error('Service categories template not available in test mode');
        }
        blob = await bulkImportService.downloadTestTemplate(importType, templateType);
      }

      // Use the new download method with multiple fallbacks
      try {
        await bulkImportService.downloadTemplateWithFallbacks(blob, getTemplateName());
        toast.success('Template downloaded successfully');
      } catch (downloadError) {
        logger.error('❌ All download methods failed:', downloadError);
        toast.error('Failed to download template. Please try again or contact support.');
      }
    } catch (error: unknown) {
      logger.error('Error downloading template:', error);

      // Show the specific error message from the service
      const errorMessage = (error as Error).message || 'Failed to download template';
      toast.error(errorMessage);
    }
  };

  // Download service categories reference
  const handleDownloadServiceCategories = async () => {
    try {
      const blob = await bulkImportService.downloadServiceCategoriesReference();

      try {
        await bulkImportService.downloadTemplateWithFallbacks(blob, 'service-categories-reference.csv');
        toast.success('Service categories reference downloaded successfully');
      } catch (downloadError) {
        logger.error('❌ All download methods failed:', downloadError);
        toast.error('Failed to download service categories reference. Please try again or contact support.');
      }
    } catch (error: unknown) {
      logger.error('Error downloading service categories reference:', error);
      const errorMessage = (error as Error).message || 'Failed to download service categories reference';
      toast.error(errorMessage);
    }
  };

  // Download services and sub-services reference for stylists (combined)
  const handleDownloadServicesAndSubServices = async () => {
    try {
      const blob = await bulkImportService.downloadServicesAndSubServicesReference();

      try {
        await bulkImportService.downloadTemplateWithFallbacks(blob, 'services-and-subservices-reference.csv');
        toast.success('Services & Sub-services reference downloaded successfully');
      } catch (downloadError) {
        logger.error('❌ All download methods failed:', downloadError);
        toast.error('Failed to download services & sub-services reference. Please try again or contact support.');
      }
    } catch (error: unknown) {
      logger.error('Error downloading services & sub-services reference:', error);
      const errorMessage = (error as Error).message || 'Failed to download services & sub-services reference';
      toast.error(errorMessage);
    }
  };

  // Start import
  const handleStartImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      logger.info('🔄 Starting import for file:', selectedFile.name);

      let response;
      switch (importType) {
        case 'services':
          response = await bulkImportService.importServices(selectedFile);
          break;
        case 'stylists':
          response = await bulkImportService.importStylists(selectedFile);
          break;
        case 'service-categories':
          response = await bulkImportService.importServiceCategories(selectedFile);
          break;
        default:
          throw new Error(`Unknown import type: ${importType}`);
      }

      logger.info('✅ Import response received:', response);

      if (response && response.jobId) {
        setJobId(response.jobId);
        toast.success('Import started successfully');

        // Start polling for progress
        startProgressPolling(response.jobId);
      } else {
        logger.error('❌ Invalid response format:', response);
        toast.error('Invalid response from server');
      }

    } catch (error: unknown) {
      logger.error('❌ Error starting import:', error);

      // More detailed error handling
      let errorMessage = 'Failed to start import';
      if ((error as { response?: { data?: { message?: string } } })?.response?.data?.message) {
        errorMessage = (error as { response: { data: { message: string } } }).response.data.message;
      } else if ((error as Error).message) {
        errorMessage = (error as Error).message;
      }

      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Start progress polling
  const startProgressPolling = (jobId: string) => {
    setPolling(true);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const progressData = await bulkImportService.getImportProgress(jobId);
        setProgress(progressData);
        
        // Stop polling when job is complete or failed
        if (progressData.status === 'completed' || progressData.status === 'failed') {
          setPolling(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          
          if (progressData.status === 'completed') {
            toast.success(`Import completed! ${progressData.successCount} items imported successfully`);
            if (onImportComplete) {
              onImportComplete();
            }
          } else {
            toast.error('Import failed');
          }
        }
      } catch (error) {
        logger.error('Error polling progress:', error);
        setPolling(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      }
    }, 2000); // Poll every 2 seconds
  };

  // Handle modal close
  const handleClose = () => {
    if (polling) {
      toast.error('Cannot close while import is in progress');
      return;
    }
    
    // Clean up
    setSelectedFile(null);
    setJobId(null);
    setProgress(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    onClose();
  };

  // Reset to initial state
  const handleReset = () => {
    setSelectedFile(null);
    setJobId(null);
    setProgress(null);
    setPolling(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleClose}
            disabled={polling}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!jobId ? (
            // File Upload Section
            <>
              {/* Download Template */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="text-blue-600 mt-1" size={20} />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-1">Download Template</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Download the CSV template with the correct format and sample data.
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="text-blue-600 mt-0.5" size={16} />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Image URLs Format:</p>
                          <p>For multiple images, use semicolon (;) as separator:</p>
                          <code className="text-xs bg-blue-100 px-2 py-1 rounded mt-1 block">
                            https://example.com/img1.jpg;https://example.com/img2.jpg
                          </code>
                        </div>
                      </div>
                    </div>

                    {(importType === 'services' || importType === 'stylists') && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-blue-800 mb-2">
                          Template Type:
                        </label>
                        <div className="flex gap-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="templateType"
                              value="name"
                              checked={templateType === 'name'}
                              onChange={(e) => setTemplateType(e.target.value as 'name' | 'displayId')}
                              className="mr-2"
                            />
                            <span className="text-sm text-blue-700">
                              {importType === 'services' ? 'Category Name' : 'Service Name'}
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="templateType"
                              value="displayId"
                              checked={templateType === 'displayId'}
                              onChange={(e) => setTemplateType(e.target.value as 'name' | 'displayId')}
                              className="mr-2"
                            />
                            <span className="text-sm text-blue-700">
                              {importType === 'services' ? 'Category Display ID' : 'Service Display ID'}
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <Download size={16} className="mr-2" />
                        Download {getTemplateName()}
                      </Button>

                      {importType === 'services' && templateType === 'displayId' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadServiceCategories}
                          className="border-green-300 text-green-700 hover:bg-green-100"
                        >
                          <Download size={16} className="mr-2" />
                          Download Categories Reference
                        </Button>
                      )}

                      {importType === 'stylists' && templateType === 'displayId' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadServicesAndSubServices}
                          className="border-green-300 text-green-700 hover:bg-green-100"
                        >
                          <Download size={16} className="mr-2" />
                          Download Services & Sub-Services Reference
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload CSV/Excel File
                </label>
                
                {!selectedFile ? (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports CSV, XLSX, and XLS files (max 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="text-green-600" size={24} />
                        <div>
                          <p className="font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {bulkImportService.formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleStartImport}
                  disabled={!selectedFile || uploading}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader className="animate-spin mr-2" size={16} />
                      Starting Import...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2" size={16} />
                      Start Import
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            // Progress Section
            <div className="space-y-6">
              {/* Progress Header */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {progress?.status === 'processing' && <Loader className="animate-spin text-blue-600" size={20} />}
                  {progress?.status === 'completed' && <CheckCircle className="text-green-600" size={20} />}
                  {progress?.status === 'failed' && <AlertCircle className="text-red-600" size={20} />}
                  {progress?.status === 'pending' && <Clock className="text-yellow-600" size={20} />}
                  
                  <h3 className="text-lg font-medium">
                    {progress?.status === 'pending' && 'Import Queued'}
                    {progress?.status === 'processing' && 'Import in Progress'}
                    {progress?.status === 'completed' && 'Import Completed'}
                    {progress?.status === 'failed' && 'Import Failed'}
                  </h3>
                </div>
                
                {progress && (
                  <p className="text-sm text-gray-600">
                    Job ID: {jobId}
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              {progress && progress.totalRows > 0 && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress: {progress.processedRows} / {progress.totalRows}</span>
                    <span>{progress.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progressPercentage}%` }}
                    />
                  </div>
                  
                  {progress.estimatedTimeRemaining && progress.status === 'processing' && (
                    <p className="text-sm text-gray-600 mt-2">
                      Estimated time remaining: {bulkImportService.formatEstimatedTime(progress.estimatedTimeRemaining)}
                    </p>
                  )}
                </div>
              )}

              {/* Results Summary */}
              {progress && progress.status !== 'pending' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{progress.successCount}</div>
                    <div className="text-sm text-green-700">Successful</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{progress.errorCount}</div>
                    <div className="text-sm text-red-700">Errors</div>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {progress && progress.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-3">Import Errors</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {progress.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium text-red-800">Row {error.row}:</span>
                        <span className="text-red-700 ml-2">{error.error}</span>
                      </div>
                    ))}
                    {progress.errors.length > 10 && (
                      <div className="text-sm text-red-600">
                        ... and {progress.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {progress?.status === 'completed' || progress?.status === 'failed' ? (
                  <>
                    <Button onClick={handleReset} className="flex-1">
                      Import Another File
                    </Button>
                    <Button variant="outline" onClick={handleClose}>
                      Close
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={handleClose} disabled className="flex-1">
                    Import in Progress...
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
