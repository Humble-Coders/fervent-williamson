/**
 * Bulk Import Job Processors
 * Handles bulk creation of services and stylists from CSV/Excel files
 */

import Bull from 'bull';
import { PrismaClient, Gender } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import XLSX from 'xlsx';
import { queueManager } from '../QueueManager';
import { isDevelopment } from '../../config/env';

const prisma = new PrismaClient();

// Job Data Interfaces
export interface BulkImportJobData {
  filePath: string;
  fileType: 'csv' | 'xlsx';
  importType: 'services' | 'stylists' | 'service-categories';
  salonId: string | null; // UUID for database operations (null for admin operations)
  salonDisplayId: number | null; // Display ID for category lookups (null for admin operations)
  userId: string;
  jobId: string;
  originalFilename: string;
}

export interface BulkImportProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  progressPercentage: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number;
}

// Service Import Data Interface
export interface ServiceImportData {
  // Main service fields (matching new CSV format)
  'Service Category Id'?: string;
  'Service Name': string;
  'Base Price': number;
  'Price Can Vary'?: boolean;
  'Popular'?: boolean;
  'Gender'?: 'MALE' | 'FEMALE' | 'UNISEX';
  'IsActive'?: boolean;
  'Service Time(min)': number;
  'Service Time Can Vary'?: boolean;
  'Image Urls'?: string; // Semicolon-separated URLs
  'Description': string;

  // Subservice fields (up to 5 subservices)
  'Sub Service 1 Name'?: string;
  'Sub Service 1 Price'?: number;
  'Sub Service 1 Price Can Vary'?: boolean;
  'Sub Service 1 Time(min)'?: number;
  'Sub Service 1 Time Can Vary'?: boolean;
  'Sub Service 1 Image Urls'?: string;

  'Sub Service 2 Name'?: string;
  'Sub Service 2 Price'?: number;
  'Sub Service 2 Price Can Vary'?: boolean;
  'Sub Service 2 Time(min)'?: number;
  'Sub Service 2 Time Can Vary'?: boolean;
  'Sub Service 2 Image Urls'?: string;

  'Sub Service 3 Name'?: string;
  'Sub Service 3 Price'?: number;
  'Sub Service 3 Price Can Vary'?: boolean;
  'Sub Service 3 Time(min)'?: number;
  'Sub Service 3 Time Can Vary'?: boolean;
  'Sub Service 3 Image Urls'?: string;

  'Sub Service 4 Name'?: string;
  'Sub Service 4 Price'?: number;
  'Sub Service 4 Price Can Vary'?: boolean;
  'Sub Service 4 Time(min)'?: number;
  'Sub Service 4 Time Can Vary'?: boolean;
  'Sub Service 4 Image Urls'?: string;

  'Sub Service 5 Name'?: string;
  'Sub Service 5 Price'?: number;
  'Sub Service 5 Price Can Vary'?: boolean;
  'Sub Service 5 Time(min)'?: number;
  'Sub Service 5 Time Can Vary'?: boolean;
  'Sub Service 5 Image Urls'?: string;

  // Legacy fields for backward compatibility
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  categoryName?: string;
  categoryDisplayId?: number;
  popular?: boolean;
  gender?: 'MALE' | 'FEMALE' | 'UNISEX';
  isActive?: boolean;
  emoji?: string;
  imageUrls?: string;
}

// Stylist Import Data Interface
export interface StylistImportData {
  name: string;
  email: string;
  phone: string;
  specialties: string; // comma-separated
  experience?: number;
  isActive?: boolean;
  serviceNames?: string; // comma-separated service names (optional)
  serviceDisplayIds?: string; // comma-separated service display IDs (optional)
  subServiceNames?: string; // comma-separated subservice names (optional)
  subServiceDisplayIds?: string; // comma-separated subservice display IDs (optional)
  imageUrls?: string; // Semicolon-separated URLs (e.g., "url1;url2;url3")
}

// Service Category Import Data Interface
export interface ServiceCategoryImportData {
  name: string;
  description?: string;
  icon?: string;
  emoji?: string;
  color?: string;
  isGlobal?: boolean;
}

export class BulkImportJobs {
  private static readonly QUEUE_NAME = 'bulk-import';
  private static progressStore = new Map<string, BulkImportProgress>();

  /**
   * Initialize job processors
   */
  public static init(): void {
    // Process bulk import jobs
    queueManager.processJobs(
      this.QUEUE_NAME,
      'bulk-import-services',
      this.processBulkImportServices.bind(this),
      1 // Process one at a time to avoid overwhelming the database
    );

    queueManager.processJobs(
      this.QUEUE_NAME,
      'bulk-import-stylists',
      this.processBulkImportStylists.bind(this),
      1 // Process one at a time to avoid overwhelming the database
    );

    queueManager.processJobs(
      this.QUEUE_NAME,
      'bulk-import-service-categories',
      this.processBulkImportServiceCategories.bind(this),
      1 // Process one at a time to avoid overwhelming the database
    );

    console.log('📊 Bulk import job processors initialized');
  }

  /**
   * Add bulk import job
   */
  public static async addBulkImportJob(data: BulkImportJobData): Promise<Bull.Job> {
    let jobName: string;
    switch (data.importType) {
      case 'services':
        jobName = 'bulk-import-services';
        break;
      case 'stylists':
        jobName = 'bulk-import-stylists';
        break;
      case 'service-categories':
        jobName = 'bulk-import-service-categories';
        break;
      default:
        throw new Error(`Unknown import type: ${data.importType}`);
    }
    
    // Initialize progress tracking
    this.progressStore.set(data.jobId, {
      jobId: data.jobId,
      status: 'pending',
      totalRows: 0,
      processedRows: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      progressPercentage: 0,
    });

    return queueManager.addJob(
      this.QUEUE_NAME,
      jobName,
      data,
      {
        attempts: 1, // Don't retry bulk imports
        delay: 1000, // 1 second delay
        removeOnComplete: 5, // Keep fewer completed jobs
        removeOnFail: 10, // Keep more failed jobs for debugging
      }
    );
  }

  /**
   * Get import progress
   */
  public static getImportProgress(jobId: string): BulkImportProgress | null {
    return this.progressStore.get(jobId) || null;
  }

  /**
   * Clear import progress (cleanup)
   */
  public static clearImportProgress(jobId: string): void {
    this.progressStore.delete(jobId);
  }

  /**
   * Process bulk import services job
   */
  private static async processBulkImportServices(job: Bull.Job<BulkImportJobData>): Promise<void> {
    const data = job.data;
    const progress = this.progressStore.get(data.jobId);
    
    if (!progress) {
      throw new Error('Progress tracking not found');
    }

    try {
      console.log(`📊 Starting bulk import services job: ${data.jobId}`);
      
      progress.status = 'processing';
      progress.startedAt = new Date();

      // Parse the file
      const rows = await this.parseFile(data.filePath, data.fileType);
      progress.totalRows = rows.length;

      console.log(`📋 Processing ${rows.length} service rows`);

      // Get salon info
      const salon = await prisma.salon.findUnique({
        where: { displayId: data.salonDisplayId },
        select: { id: true, name: true, displayId: true }
      });

      if (!salon) {
        throw new Error('Salon not found');
      }

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const rowData = rows[i] as ServiceImportData;
        
        try {
          await this.createService(rowData, salon.id, data.salonDisplayId);
          progress.successCount++;
        } catch (error) {
          progress.errorCount++;
          progress.errors.push({
            row: i + 1,
            data: rowData,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        progress.processedRows++;
        
        // Update progress every 10 rows or on last row
        if (progress.processedRows % 10 === 0 || progress.processedRows === progress.totalRows) {
          job.progress(Math.round((progress.processedRows / progress.totalRows) * 100));
        }
      }

      progress.status = 'completed';
      progress.completedAt = new Date();

      console.log(`✅ Bulk import services completed: ${progress.successCount} success, ${progress.errorCount} errors`);

    } catch (error) {
      progress.status = 'failed';
      progress.completedAt = new Date();
      console.error('❌ Bulk import services failed:', error);
      throw error;
    } finally {
      // Clean up uploaded file
      this.cleanupFile(data.filePath);
    }
  }

  /**
   * Process bulk import stylists job
   */
  private static async processBulkImportStylists(job: Bull.Job<BulkImportJobData>): Promise<void> {
    const data = job.data;
    const progress = this.progressStore.get(data.jobId);
    
    if (!progress) {
      throw new Error('Progress tracking not found');
    }

    try {
      console.log(`📊 Starting bulk import stylists job: ${data.jobId}`);
      
      progress.status = 'processing';
      progress.startedAt = new Date();

      // Parse the file
      const rows = await this.parseFile(data.filePath, data.fileType);
      progress.totalRows = rows.length;

      console.log(`📋 Processing ${rows.length} stylist rows`);

      // Get salon info and services with subservices
      const [salon, services] = await Promise.all([
        prisma.salon.findUnique({
          where: { displayId: data.salonDisplayId },
          select: { id: true, name: true, displayId: true }
        }),
        prisma.service.findMany({
          where: { salon: { displayId: data.salonDisplayId } },
          select: {
            id: true,
            name: true,
            subServices: {
              select: {
                id: true,
                name: true,
                displayId: true
              }
            }
          }
        })
      ]);

      if (!salon) {
        throw new Error('Salon not found');
      }

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const rowData = rows[i] as StylistImportData;
        
        try {
          await this.createStylist(rowData, salon.id, data.salonDisplayId, services);
          progress.successCount++;
        } catch (error) {
          progress.errorCount++;
          progress.errors.push({
            row: i + 1,
            data: rowData,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        progress.processedRows++;
        
        // Update progress every 10 rows or on last row
        if (progress.processedRows % 10 === 0 || progress.processedRows === progress.totalRows) {
          job.progress(Math.round((progress.processedRows / progress.totalRows) * 100));
        }
      }

      progress.status = 'completed';
      progress.completedAt = new Date();

      console.log(`✅ Bulk import stylists completed: ${progress.successCount} success, ${progress.errorCount} errors`);

    } catch (error) {
      progress.status = 'failed';
      progress.completedAt = new Date();
      console.error('❌ Bulk import stylists failed:', error);
      throw error;
    } finally {
      // Clean up uploaded file
      this.cleanupFile(data.filePath);
    }
  }

  /**
   * Process bulk import service categories job
   */
  private static async processBulkImportServiceCategories(job: Bull.Job<BulkImportJobData>): Promise<void> {
    const data = job.data;
    const progress = this.progressStore.get(data.jobId);

    if (!progress) {
      throw new Error('Progress tracking not found');
    }

    try {
      console.log(`📊 Processing bulk import service categories job: ${data.jobId}`);

      // Update progress to processing
      progress.status = 'processing';
      progress.startedAt = new Date();
      this.progressStore.set(data.jobId, progress);

      // Parse the uploaded file
      const rows = await this.parseFile(data.filePath, data.fileType);
      console.log(`📄 Parsed ${rows.length} rows from ${data.originalFilename}`);

      // Update total rows
      progress.totalRows = rows.length;
      this.progressStore.set(data.jobId, progress);

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // Debug: Log the parsed row data
        console.log(`🔍 Debug row ${i + 2}:`, JSON.stringify(row, null, 2));

        try {
          await this.createServiceCategory(row as ServiceCategoryImportData, data.salonDisplayId, data.userId);

          progress.successCount++;
          console.log(`✅ Created service category: ${row.name}`);
        } catch (error) {
          progress.errorCount++;
          progress.errors.push({
            row: i + 2, // +2 because CSV has header row and arrays are 0-indexed
            data: row,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          console.error(`❌ Error creating service category at row ${i + 2}:`, error);
        }

        // Update progress
        progress.processedRows = i + 1;
        progress.progressPercentage = Math.round((progress.processedRows / progress.totalRows) * 100);
        this.progressStore.set(data.jobId, progress);
      }

      // Mark as completed
      progress.status = 'completed';
      progress.completedAt = new Date();
      this.progressStore.set(data.jobId, progress);

      console.log(`✅ Bulk import service categories completed: ${progress.successCount} success, ${progress.errorCount} errors`);

    } catch (error) {
      console.error('❌ Error processing bulk import service categories:', error);

      // Mark as failed
      progress.status = 'failed';
      progress.completedAt = new Date();
      this.progressStore.set(data.jobId, progress);

      throw error;
    } finally {
      // Clean up uploaded file
      this.cleanupFile(data.filePath);
    }
  }

  /**
   * Parse CSV or Excel file
   */
  private static async parseFile(filePath: string, fileType: 'csv' | 'xlsx'): Promise<any[]> {
    if (fileType === 'csv') {
      return this.parseCSV(filePath);
    } else {
      return this.parseExcel(filePath);
    }
  }

  /**
   * Parse CSV file
   */
  private static async parseCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  /**
   * Parse Excel file
   */
  private static parseExcel(filePath: string): any[] {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }

  /**
   * Create service from import data
   */
  private static async createService(data: ServiceImportData, salonId: string, salonDisplayId: number): Promise<void> {
    // Normalize data to handle both new and legacy formats
    const serviceName = data['Service Name'] || data.name;
    const serviceDescription = data['Description'] || data.description;
    const servicePrice = data['Base Price'] || data.price;
    const servicePriceCanVary = data['Price Can Vary'] !== undefined ? data['Price Can Vary'] : false;
    const serviceTimeCanVary = data['Service Time Can Vary'] !== undefined ? data['Service Time Can Vary'] : false;
    const serviceDuration = data['Service Time(min)'] || data.duration;
    const categoryId = data['Service Category Id'] || data.categoryDisplayId?.toString() || data.categoryName;
    const servicePopular = data['Popular'] !== undefined ? data['Popular'] : data.popular;
    const serviceGender = data['Gender'] || data.gender;
    const serviceIsActive = data['IsActive'] !== undefined ? data['IsActive'] : data.isActive;
    const serviceImageUrls = data['Image Urls'] || data.imageUrls;

    // Check if this service has any sub-services (name is optional, will be auto-generated if missing)
    const hasSubServices = (
      (data['Sub Service 1 Price'] && data['Sub Service 1 Time(min)']) ||
      (data['Sub Service 2 Price'] && data['Sub Service 2 Time(min)']) ||
      (data['Sub Service 3 Price'] && data['Sub Service 3 Time(min)']) ||
      (data['Sub Service 4 Price'] && data['Sub Service 4 Time(min)']) ||
      (data['Sub Service 5 Price'] && data['Sub Service 5 Time(min)'])
    );

    // Validate required fields - either main service pricing OR sub-services must be provided
    if (!serviceName) {
      throw new Error('Missing required field: Service Name');
    }

    if (!hasSubServices && (!servicePrice || !serviceDuration)) {
      throw new Error('Missing required fields: Either provide Base Price & Service Time(min) for main service, or Sub Service details');
    }

    // Validate that category is provided
    if (!categoryId) {
      throw new Error('Service Category Id must be provided');
    }

    // Find category by display ID or name
    let category = null;

    // Try to parse as display ID first
    const categoryDisplayId = parseInt(categoryId);
    if (!isNaN(categoryDisplayId)) {
      // Find by display ID (global categories have null salonDisplayId, salon-specific have salonDisplayId)
      category = await prisma.serviceCategory.findFirst({
        where: {
          displayId: categoryDisplayId,
          OR: [
            { isGlobal: true },
            { salonDisplayId: salonDisplayId }
          ]
        }
      });

      if (!category) {
        // Auto-create missing category with a generic name based on display ID
        const categoryName = this.getCategoryNameByDisplayId(categoryDisplayId);

        // Check if category with this name already exists for this salon
        const existingCategory = await prisma.serviceCategory.findFirst({
          where: {
            name: categoryName,
            salonDisplayId: salonDisplayId
          }
        });

        if (existingCategory) {
          category = existingCategory;
          console.log(`📋 Using existing category: ${categoryName} (Display ID: ${category.displayId})`);
        } else {
          category = await prisma.serviceCategory.create({
            data: {
              name: categoryName,
              icon: 'tag',
              emoji: '🔧',
              description: `Auto-created category for ${categoryName}`,
              isGlobal: false,
              salonDisplayId: salonDisplayId
            }
          });
          console.log(`📋 Auto-created category: ${categoryName} (Display ID: ${category.displayId})`);
        }
      }
    } else {
      // Find by name
      category = await prisma.serviceCategory.findFirst({
        where: {
          name: categoryId,
          OR: [
            { isGlobal: true },
            { salonDisplayId: salonDisplayId }
          ]
        }
      });

      if (!category) {
        // Create salon-specific category
        category = await prisma.serviceCategory.create({
          data: {
            name: categoryId,
            icon: 'tag',
            emoji: '🔧',
            description: `Category for ${categoryId}`,
            isGlobal: false,
            salonDisplayId: salonDisplayId
          }
        });
      }
    }

    // Process image URLs (semicolon-separated)
    let imageUrls: string[] = [];
    if (serviceImageUrls) {
      imageUrls = serviceImageUrls
        .split(';')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      console.log(`📸 Processing ${imageUrls.length} image URLs for service: ${serviceName}`);
      console.log(`📸 Image URLs: ${imageUrls.join(', ')}`);
    }

    // For services with only sub-services, use default/derived values for main service
    let finalPrice = servicePrice;
    let finalDuration = serviceDuration;
    let finalPriceCanVary = Boolean(servicePriceCanVary) || false;
    let finalTimeCanVary = Boolean(serviceTimeCanVary) || false;

    if (hasSubServices && (!servicePrice || !serviceDuration)) {
      // Find the first available sub-service to use as base for main service pricing
      let firstSubService = null;
      for (let i = 1; i <= 5; i++) {
        const subName = data[`Sub Service ${i} Name`];
        const subPrice = data[`Sub Service ${i} Price`];
        const subDuration = data[`Sub Service ${i} Time(min)`];

        if (subPrice && subDuration) {
          firstSubService = {
            name: subName || `${serviceName} - Option ${i}`, // Auto-generate name if missing
            price: subPrice,
            duration: subDuration,
            priceCanVary: data[`Sub Service ${i} Price Can Vary`],
            timeCanVary: data[`Sub Service ${i} Time Can Vary`]
          };
          break;
        }
      }

      if (firstSubService) {
        finalPrice = firstSubService.price;
        finalDuration = firstSubService.duration;
        finalPriceCanVary = Boolean(firstSubService.priceCanVary) || true; // Default to variable for sub-service based services
        finalTimeCanVary = Boolean(firstSubService.timeCanVary) || true;

        console.log(`📋 Using sub-service pricing for main service: ${serviceName} (Price: ${finalPrice}, Duration: ${finalDuration}, From: ${firstSubService.name})`);
      }
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        name: serviceName.trim(),
        description: serviceDescription ? serviceDescription.trim() : `Professional ${serviceName.trim()} service`,
        price: Number(finalPrice),
        priceCanVary: finalPriceCanVary,
        timeCanVary: finalTimeCanVary,
        duration: Number(finalDuration),
        popular: Boolean(servicePopular) || false,
        gender: this.mapGenderToEnum(serviceGender),
        isActive: serviceIsActive !== undefined ? Boolean(serviceIsActive) : true,
        emoji: '✂️',
        salonId: salonId,
        categoryId: category!.id,
        images: []
      }
    });

    // Download and organize images if URLs provided
    if (imageUrls.length > 0) {
      await this.downloadAndOrganizeImages(imageUrls, 'service', salonId, service.id);
    }

    // Create subservices if provided
    await this.createSubServices(data, service.id, salonId);
  }

  /**
   * Create subservices for a service
   */
  private static async createSubServices(data: ServiceImportData, serviceId: string, salonId: string): Promise<void> {
    const serviceName = data['Service Name'] || data.name || 'Service';

    const subServices = [
      {
        name: data['Sub Service 1 Name'],
        price: data['Sub Service 1 Price'],
        priceCanVary: data['Sub Service 1 Price Can Vary'],
        duration: data['Sub Service 1 Time(min)'],
        timeCanVary: data['Sub Service 1 Time Can Vary'],
        imageUrls: data['Sub Service 1 Image Urls']
      },
      {
        name: data['Sub Service 2 Name'],
        price: data['Sub Service 2 Price'],
        priceCanVary: data['Sub Service 2 Price Can Vary'],
        duration: data['Sub Service 2 Time(min)'],
        timeCanVary: data['Sub Service 2 Time Can Vary'],
        imageUrls: data['Sub Service 2 Image Urls']
      },
      {
        name: data['Sub Service 3 Name'],
        price: data['Sub Service 3 Price'],
        priceCanVary: data['Sub Service 3 Price Can Vary'],
        duration: data['Sub Service 3 Time(min)'],
        timeCanVary: data['Sub Service 3 Time Can Vary'],
        imageUrls: data['Sub Service 3 Image Urls']
      },
      {
        name: data['Sub Service 4 Name'],
        price: data['Sub Service 4 Price'],
        priceCanVary: data['Sub Service 4 Price Can Vary'],
        duration: data['Sub Service 4 Time(min)'],
        timeCanVary: data['Sub Service 4 Time Can Vary'],
        imageUrls: data['Sub Service 4 Image Urls']
      },
      {
        name: data['Sub Service 5 Name'],
        price: data['Sub Service 5 Price'],
        priceCanVary: data['Sub Service 5 Price Can Vary'],
        duration: data['Sub Service 5 Time(min)'],
        timeCanVary: data['Sub Service 5 Time Can Vary'],
        imageUrls: data['Sub Service 5 Image Urls']
      }
    ];

    for (let i = 0; i < subServices.length; i++) {
      const subServiceData = subServices[i];
      if (subServiceData.price && subServiceData.duration) {
        // Auto-generate name if missing
        const subServiceName = subServiceData.name || `${serviceName} - Option ${i + 1}`;
        // Process subservice image URLs (semicolon-separated)
        let subServiceImageUrls: string[] = [];
        if (subServiceData.imageUrls) {
          subServiceImageUrls = subServiceData.imageUrls
            .split(';')
            .map(url => url.trim())
            .filter(url => url.length > 0);

          console.log(`📸 Processing ${subServiceImageUrls.length} image URLs for subservice: ${subServiceName}`);
        }

        // Create subservice
        const subService = await prisma.subService.create({
          data: {
            name: subServiceName.trim(),
            description: `${subServiceName} - Part of ${serviceName}`,
            price: Number(subServiceData.price),
            priceCanVary: Boolean(subServiceData.priceCanVary) || false,
            timeCanVary: Boolean(subServiceData.timeCanVary) || false,
            duration: Number(subServiceData.duration),
            serviceId: serviceId,
            isActive: true,
            images: []
          }
        });

        // Download and organize subservice images if URLs provided
        if (subServiceImageUrls.length > 0) {
          await this.downloadAndOrganizeImages(subServiceImageUrls, 'subservice', salonId, subService.id);
        }
      }
    }
  }

  /**
   * Create stylist from import data
   */
  private static async createStylist(
    data: StylistImportData,
    salonId: string,
    salonDisplayId: number,
    availableServices: Array<{
      id: string;
      name: string;
      subServices: Array<{
        id: string;
        name: string;
        displayId: number;
      }>;
    }>
  ): Promise<void> {
    // Validate required fields
    if (!data.name || !data.email || !data.phone) {
      throw new Error('Missing required fields: name, email, phone');
    }

    // Check if stylist already exists
    const existingStylist = await prisma.stylist.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone }
        ],
        salonId: salonId
      }
    });

    if (existingStylist) {
      throw new Error(`Stylist already exists with email ${data.email} or phone ${data.phone}`);
    }

    // Parse specialties
    const specialties = data.specialties
      ? data.specialties.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    // Parse service assignments - support services, subservices, names and display IDs
    let services: any = {};

    // Handle service names (legacy support)
    if (data.serviceNames && data.serviceNames.trim()) {
      const serviceNames = data.serviceNames
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      console.log(`🔍 Looking for services by name: ${serviceNames.join(', ')}`);

      for (const serviceName of serviceNames) {
        const matchingService = availableServices.find(
          service => service.name.toLowerCase() === serviceName.toLowerCase()
        );

        if (matchingService) {
          services[matchingService.id] = true;
          console.log(`✅ Found service by name: ${serviceName} -> ${matchingService.id}`);
        } else {
          console.log(`⚠️ Service not found by name: ${serviceName}`);
        }
      }
    }

    // Handle service display IDs (preferred method)
    if (data.serviceDisplayIds && data.serviceDisplayIds.trim()) {
      const serviceDisplayIds = data.serviceDisplayIds
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0)
        .map(id => parseInt(id))
        .filter(id => !isNaN(id));

      console.log(`🔍 Looking for services by display ID: ${serviceDisplayIds.join(', ')}`);

      // Get services by display IDs
      const servicesByDisplayId = await prisma.service.findMany({
        where: {
          displayId: { in: serviceDisplayIds },
          salon: { displayId: salonDisplayId }
        },
        select: { id: true, displayId: true, name: true }
      });

      for (const service of servicesByDisplayId) {
        services[service.id] = true;
        console.log(`✅ Found service by display ID: ${service.displayId} (${service.name}) -> ${service.id}`);
      }

      // Check for missing services
      const foundDisplayIds = servicesByDisplayId.map(s => s.displayId);
      const missingDisplayIds = serviceDisplayIds.filter(id => !foundDisplayIds.includes(id));
      if (missingDisplayIds.length > 0) {
        console.log(`⚠️ Services not found by display ID: ${missingDisplayIds.join(', ')}`);
      }
    }

    // Handle subservice names
    if (data.subServiceNames && data.subServiceNames.trim()) {
      const subServiceNames = data.subServiceNames
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      console.log(`🔍 Looking for subservices by name: ${subServiceNames.join(', ')}`);

      for (const subServiceName of subServiceNames) {
        let found = false;
        for (const service of availableServices) {
          const matchingSubService = service.subServices.find(
            subService => subService.name.toLowerCase() === subServiceName.toLowerCase()
          );

          if (matchingSubService) {
            // Initialize service object if it doesn't exist
            if (!services[service.id]) {
              services[service.id] = {};
            }
            // If service was previously set to true (all subservices), convert to object
            if (services[service.id] === true) {
              services[service.id] = {};
            }
            services[service.id][matchingSubService.id] = true;
            console.log(`✅ Found subservice by name: ${subServiceName} -> ${service.name}/${matchingSubService.id}`);
            found = true;
            break;
          }
        }
        if (!found) {
          console.log(`⚠️ Subservice not found by name: ${subServiceName}`);
        }
      }
    }

    // Handle subservice display IDs
    if (data.subServiceDisplayIds && data.subServiceDisplayIds.trim()) {
      const subServiceDisplayIds = data.subServiceDisplayIds
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0)
        .map(id => parseInt(id))
        .filter(id => !isNaN(id));

      console.log(`🔍 Looking for subservices by display ID: ${subServiceDisplayIds.join(', ')}`);

      // Get subservices by display IDs
      const subServicesByDisplayId = await prisma.subService.findMany({
        where: {
          displayId: { in: subServiceDisplayIds },
          service: { salon: { displayId: salonDisplayId } }
        },
        select: {
          id: true,
          displayId: true,
          name: true,
          serviceId: true,
          service: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      for (const subService of subServicesByDisplayId) {
        // Initialize service object if it doesn't exist
        if (!services[subService.serviceId]) {
          services[subService.serviceId] = {};
        }
        // If service was previously set to true (all subservices), convert to object
        if (services[subService.serviceId] === true) {
          services[subService.serviceId] = {};
        }
        services[subService.serviceId][subService.id] = true;
        console.log(`✅ Found subservice by display ID: ${subService.displayId} (${subService.service.name}/${subService.name}) -> ${subService.id}`);
      }

      // Check for missing subservices
      const foundSubServiceDisplayIds = subServicesByDisplayId.map(s => s.displayId);
      const missingSubServiceDisplayIds = subServiceDisplayIds.filter(id => !foundSubServiceDisplayIds.includes(id));
      if (missingSubServiceDisplayIds.length > 0) {
        console.log(`⚠️ Subservices not found by display ID: ${missingSubServiceDisplayIds.join(', ')}`);
      }
    }

    // If no services or subservices specified, stylist can work on all services
    if (!data.serviceNames?.trim() && !data.serviceDisplayIds?.trim() &&
        !data.subServiceNames?.trim() && !data.subServiceDisplayIds?.trim()) {
      console.log(`📝 No specific services/subservices provided for ${data.name}, can work on all services`);
      services = {}; // Empty object means can work on all services
    }

    // Process image URLs (semicolon-separated)
    let imageUrls: string[] = [];
    if (data.imageUrls) {
      imageUrls = data.imageUrls
        .split(';')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      console.log(`📸 Processing ${imageUrls.length} image URLs for stylist: ${data.name}`);
      console.log(`📸 Image URLs: ${imageUrls.join(', ')}`);
    }

    // Create stylist
    const stylist = await prisma.stylist.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        specialties: specialties,
        experience: data.experience || 0,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        salonId: salonId,
        rating: 0,
        services: services,
        images: []
      }
    });

    // Download and organize images if URLs provided
    if (imageUrls.length > 0) {
      await this.downloadAndOrganizeImages(imageUrls, 'stylist', salonId, stylist.id);
    }
  }

  /**
   * Create service category from import data
   */
  private static async createServiceCategory(
    data: ServiceCategoryImportData,
    salonDisplayId: number | null,
    userId: string
  ): Promise<void> {
    // Validate required fields

    if (!data.name || data.name.trim() === '') {
      throw new Error('Category name is required');
    }

    // Validate that salonDisplayId is provided (all imported categories are salon-specific)
    if (!salonDisplayId) {
      throw new Error('Salon ID is required for category import');
    }

    // Check if category already exists for this salon
    const existingCategory = await prisma.serviceCategory.findFirst({
      where: {
        name: data.name.trim(),
        salonDisplayId: salonDisplayId,
        isGlobal: false
      }
    });

    if (existingCategory) {
      throw new Error(`Category "${data.name}" already exists for this salon`);
    }

    // Create the salon-specific service category
    const category = await prisma.serviceCategory.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || '',
        icon: data.icon?.trim() || 'tag',
        emoji: data.emoji?.trim() || '🏷️',
        color: data.color?.trim() || '#6B7280',
        isGlobal: false, // All imported categories are salon-specific
        salonDisplayId: salonDisplayId,
      }
    });

    console.log(`✅ Created service category: ${category.name} (ID: ${category.displayId}, Salon-specific)`);
  }

  /**
   * Download and organize images from URLs
   */
  private static async downloadAndOrganizeImages(
    imageUrls: string[],
    type: 'service' | 'stylist' | 'subservice',
    salonId: string,
    entityId: string
  ): Promise<void> {
    try {
      // Get salon and entity info for folder structure
      const salon = await prisma.salon.findUnique({
        where: { id: salonId },
        select: { name: true, displayId: true }
      });

      if (!salon) {
        console.error('❌ Salon not found for image organization');
        return;
      }

      let entity: any = null;
      if (type === 'service') {
        entity = await prisma.service.findUnique({
          where: { id: entityId },
          select: { name: true, displayId: true }
        });
      } else if (type === 'stylist') {
        entity = await prisma.stylist.findUnique({
          where: { id: entityId },
          select: { name: true, displayId: true }
        });
      } else if (type === 'subservice') {
        entity = await prisma.subService.findUnique({
          where: { id: entityId },
          select: { name: true, displayId: true }
        });
      }

      if (!entity) {
        console.error(`❌ ${type} not found for image organization`);
        return;
      }

      // Create organized folder path
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const salonFolder = `${salon.name.replace(/[^a-zA-Z0-9]/g, '-')}-${salon.displayId}`;
      const entityFolder = `${entity.name.replace(/[^a-zA-Z0-9]/g, '-')}-${entity.displayId}`;
      const targetPath = path.join(uploadsDir, 'salons', salonFolder, `${type}s`, entityFolder);

      // Create directory if it doesn't exist
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }

      const organizedUrls: string[] = [];

      // Download each image
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        try {
          console.log(`📥 Downloading image ${i + 1}/${imageUrls.length}: ${imageUrl}`);

          const response = await fetch(imageUrl);
          if (!response.ok) {
            console.error(`❌ Failed to download image: ${imageUrl} - ${response.statusText}`);
            continue;
          }

          const buffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(buffer);

          // Get file extension from URL or default to jpg
          let extension = 'jpg'; // Default extension
          try {
            const url = new URL(imageUrl);
            const pathname = url.pathname;
            const lastDot = pathname.lastIndexOf('.');
            if (lastDot > 0) {
              const ext = pathname.substring(lastDot + 1).toLowerCase();
              // Only use common image extensions
              if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
                extension = ext;
              }
            }
          } catch (error) {
            console.warn(`⚠️ Could not parse URL for extension: ${imageUrl}, using default .jpg`);
          }

          const filename = `image-${i + 1}.${extension}`;
          const filePath = path.join(targetPath, filename);

          // Save file
          fs.writeFileSync(filePath, uint8Array);

          // Create relative URL
          const relativePath = path.relative(uploadsDir, filePath);
          const imageUrl_organized = `/uploads/${relativePath.replace(/\\/g, '/')}`;
          organizedUrls.push(imageUrl_organized);

          console.log(`✅ Downloaded and organized: ${imageUrl_organized}`);
        } catch (error) {
          console.error(`❌ Error downloading image ${imageUrl}:`, error);
        }
      }

      // Update entity with organized image URLs
      if (organizedUrls.length > 0) {
        if (type === 'service') {
          await prisma.service.update({
            where: { id: entityId },
            data: { images: organizedUrls }
          });
        } else if (type === 'stylist') {
          await prisma.stylist.update({
            where: { id: entityId },
            data: { images: organizedUrls }
          });
        }
        console.log(`✅ Updated ${type} with ${organizedUrls.length} organized images`);
      }
    } catch (error) {
      console.error('❌ Error downloading and organizing images:', error);
    }
  }

  /**
   * Get category name by display ID for auto-creation
   */
  private static getCategoryNameByDisplayId(displayId: number): string {
    const categoryMap: { [key: number]: string } = {
      1: 'Basic Services',
      2: 'Hair Coloring',
      3: 'Hair Treatments',
      4: 'Spa & Relaxation',
      5: 'Styling Services'
    };

    return categoryMap[displayId] || `Category ${displayId}`;
  }

  /**
   * Map gender string to enum value
   */
  private static mapGenderToEnum(gender: string | undefined): Gender {
    if (!gender) return Gender.UNISEX;

    const genderMap: { [key: string]: Gender } = {
      'male': Gender.MALE,
      'female': Gender.FEMALE,
      'unisex': Gender.UNISEX,
      'other': Gender.OTHER,
      'prefer not to say': Gender.PREFER_NOT_TO_SAY
    };

    return genderMap[gender.toLowerCase()] || Gender.UNISEX;
  }

  /**
   * Clean up uploaded file
   */
  private static cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Cleaned up file: ${filePath}`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up file:', error);
    }
  }

  /**
   * Generate CSV template for services
   */
  public static generateServicesTemplate(templateType: 'name' | 'displayId' = 'name'): string {
    const headers = [
      'Service Category Id',
      'Service Name',
      'Base Price',
      'Price Can Vary',
      'Popular',
      'Gender',
      'IsActive',
      'Service Time(min)',
      'Service Time Can Vary',
      'Image Urls',
      'Description',
      'Sub Service 1 Name',
      'Sub Service 1 Price',
      'Sub Service 1 Price Can Vary',
      'Sub Service 1 Time(min)',
      'Sub Service 1 Time Can Vary',
      'Sub Service 1 Image Urls',
      'Sub Service 2 Name',
      'Sub Service 2 Price',
      'Sub Service 2 Price Can Vary',
      'Sub Service 2 Time(min)',
      'Sub Service 2 Time Can Vary',
      'Sub Service 2 Image Urls',
      'Sub Service 3 Name',
      'Sub Service 3 Price',
      'Sub Service 3 Price Can Vary',
      'Sub Service 3 Time(min)',
      'Sub Service 3 Time Can Vary',
      'Sub Service 3 Image Urls',
      'Sub Service 4 Name',
      'Sub Service 4 Price',
      'Sub Service 4 Price Can Vary',
      'Sub Service 4 Time(min)',
      'Sub Service 4 Time Can Vary',
      'Sub Service 4 Image Urls',
      'Sub Service 5 Name',
      'Sub Service 5 Price',
      'Sub Service 5 Price Can Vary',
      'Sub Service 5 Time(min)',
      'Sub Service 5 Time Can Vary',
      'Sub Service 5 Image Urls'
    ];

    const sampleData = [
      [
        templateType === 'name' ? 'Hair Services' : '1', // Service Category Id
        'Hair Cut & Style', // Service Name
        '500', // Base Price
        'true', // Price Can Vary
        'true', // Popular
        'UNISEX', // Gender
        'true', // IsActive
        '45', // Service Time(min)
        'true', // Service Time Can Vary
        'https://example.com/haircut1.jpg;https://example.com/haircut2.jpg', // Image Urls
        'Professional hair cutting and styling service', // Description
        'Basic Cut', // Sub Service 1 Name
        '300', // Sub Service 1 Price
        'false', // Sub Service 1 Price Can Vary
        '30', // Sub Service 1 Time(min)
        'false', // Sub Service 1 Time Can Vary
        'https://example.com/basic-cut.jpg', // Sub Service 1 Image Urls
        'Premium Cut', // Sub Service 2 Name
        '500', // Sub Service 2 Price
        'true', // Sub Service 2 Price Can Vary
        '45', // Sub Service 2 Time(min)
        'true', // Sub Service 2 Time Can Vary
        'https://example.com/premium-cut.jpg', // Sub Service 2 Image Urls
        '', '', '', '', '', // Sub Service 3 (empty)
        '', '', '', '', '', // Sub Service 4 (empty)
        '', '', '', '', ''  // Sub Service 5 (empty)
      ],
      [
        templateType === 'name' ? 'Hair Services' : '1', // Service Category Id
        'Hair Color', // Service Name
        '1500', // Base Price
        'false', // Price Can Vary
        'false', // Popular
        'UNISEX', // Gender
        'true', // IsActive
        '120', // Service Time(min)
        'false', // Service Time Can Vary
        'https://example.com/haircolor.jpg', // Image Urls
        'Full hair coloring service with premium products', // Description
        'Root Touch-up', // Sub Service 1 Name
        '800', // Sub Service 1 Price
        'true', // Sub Service 1 Price Can Vary
        '60', // Sub Service 1 Time(min)
        'true', // Sub Service 1 Time Can Vary
        'https://example.com/root-touchup.jpg', // Sub Service 1 Image Urls
        'Full Color', // Sub Service 2 Name
        '1200', // Sub Service 2 Price
        'false', // Sub Service 2 Price Can Vary
        '90', // Sub Service 2 Time(min)
        'false', // Sub Service 2 Time Can Vary
        'https://example.com/full-color.jpg', // Sub Service 2 Image Urls
        'Highlights', // Sub Service 3 Name
        '1500', // Sub Service 3 Price
        'true', // Sub Service 3 Price Can Vary
        '120', // Sub Service 3 Time(min)
        'true', // Sub Service 3 Time Can Vary
        'https://example.com/highlights.jpg', // Sub Service 3 Image Urls
        '', '', '', '', '', // Sub Service 4 (empty)
        '', '', '', '', ''  // Sub Service 5 (empty)
      ]
    ];

    // Helper function to escape CSV fields
    const escapeCSVField = (field: any): string => {
      // Handle null/undefined values first
      if (field === null || field === undefined) {
        return '';
      }
      // Convert to string
      const fieldStr = String(field);
      if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
        return `"${fieldStr.replace(/"/g, '""')}"`;
      }
      return fieldStr;
    };

    return [headers, ...sampleData]
      .map(row => row.map(escapeCSVField).join(','))
      .join('\n');
  }

  /**
   * Generate CSV template for stylists
   */
  public static generateStylistsTemplate(templateType: 'name' | 'displayId' = 'name'): string {
    const headers = templateType === 'displayId'
      ? [
          'name',
          'email',
          'phone',
          'specialties',
          'experience',
          'isActive',
          'serviceDisplayIds',
          'subServiceDisplayIds',
          'imageUrls'
        ]
      : [
          'name',
          'email',
          'phone',
          'specialties',
          'experience',
          'isActive',
          'serviceNames',
          'subServiceNames',
          'imageUrls'
        ];

    const sampleData = templateType === 'displayId'
      ? [
          [
            'John Doe',
            'john.doe@example.com',
            '+91 9876543210',
            'Hair Cutting, Hair Styling, Hair Coloring',
            '5',
            'true',
            '1, 2, 3',
            '',
            'https://example.com/stylist1.jpg;https://example.com/stylist1-2.jpg'
          ],
          [
            'Jane Smith',
            'jane.smith@example.com',
            '+91 9876543211',
            'Facial Treatment, Skincare, Massage',
            '3',
            'true',
            '',
            '10, 11, 12',
            'https://example.com/stylist2.jpg'
          ],
          [
            'Mike Johnson',
            'mike.johnson@example.com',
            '+91 9876543212',
            'Nail Art, Manicure, Pedicure',
            '2',
            'true',
            '4, 5',
            '13, 14',
            ''
          ],
          [
            'Sarah Wilson',
            'sarah.wilson@example.com',
            '+91 9876543213',
            'All Services',
            '7',
            'true',
            '',
            '',
            'https://example.com/stylist4.jpg'
          ]
        ]
      : [
          [
            'John Doe',
            'john.doe@example.com',
            '+91 9876543210',
            'Hair Cutting, Hair Styling, Hair Coloring',
            '5',
            'true',
            'Hair Cut & Style, Hair Color',
            '',
            'https://example.com/stylist1.jpg;https://example.com/stylist1-2.jpg'
          ],
          [
            'Jane Smith',
            'jane.smith@example.com',
            '+91 9876543211',
            'Facial Treatment, Skincare, Massage',
            '3',
            'true',
            '',
            'Deep Cleansing Facial, Anti-Aging Treatment, Hydrating Mask',
            'https://example.com/stylist2.jpg'
          ],
          [
            'Mike Johnson',
            'mike.johnson@example.com',
            '+91 9876543212',
            'Nail Art, Manicure, Pedicure',
            '2',
            'true',
            'Manicure, Pedicure',
            'French Manicure, Gel Polish, Nail Art Design',
            ''
          ],
          [
            'Sarah Wilson',
            'sarah.wilson@example.com',
            '+91 9876543213',
            'All Services',
            '7',
            'true',
            '',
            '',
            'https://example.com/stylist4.jpg'
          ]
        ];

    // Helper function to escape CSV fields
    const escapeCSVField = (field: any): string => {
      // Handle null/undefined values first
      if (field === null || field === undefined) {
        return '';
      }
      // Convert to string
      const fieldStr = String(field);
      if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
        return `"${fieldStr.replace(/"/g, '""')}"`;
      }
      return fieldStr;
    };

    return [headers, ...sampleData]
      .map(row => row.map(escapeCSVField).join(','))
      .join('\n');
  }

  /**
   * Generate CSV template for service categories import
   */
  public static generateServiceCategoriesTemplate(): string {
    const headers = [
      'name',
      'description',
      'icon',
      'emoji',
      'color'
    ];

    const sampleData = [
      [
        'Hair Services',
        'Hair cutting, styling, coloring and treatments',
        'scissors',
        '✂️',
        '#FF6B6B'
      ],
      [
        'Nail Services',
        'Manicure, pedicure and nail art services',
        'hand',
        '💅',
        '#4ECDC4'
      ],
      [
        'Facial & Skincare',
        'Facial treatments, skincare and beauty services',
        'sparkles',
        '🧴',
        '#45B7D1'
      ],
      [
        'Spa Services',
        'Relaxing spa and wellness treatments',
        '',
        '',
        ''
      ],
      [
        'Custom Category',
        'Your custom salon category'
      ]
    ];

    // Properly escape CSV fields that contain commas
    const escapeCsvField = (field: any): string => {
      // Handle null/undefined values first
      if (field === null || field === undefined) {
        return '';
      }
      // Convert to string
      const fieldStr = String(field);
      if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
        return `"${fieldStr.replace(/"/g, '""')}"`;
      }
      return fieldStr;
    };

    const csvRows = [headers, ...sampleData].map(row =>
      row.map(field => escapeCsvField(field)).join(',')
    );

    return csvRows.join('\n');
  }

  /**
   * Generate service categories CSV for reference
   */
  public static async generateServiceCategoriesReference(salonDisplayId?: number): Promise<string> {
    const headers = ['displayId', 'name', 'description', 'isGlobal', 'emoji'];

    // Get categories (global + salon-specific if salonDisplayId provided)
    const whereClause: any = {
      OR: [{ isGlobal: true }]
    };

    if (salonDisplayId) {
      whereClause.OR.push({ salonDisplayId: salonDisplayId });
    }

    const categories = await prisma.serviceCategory.findMany({
      where: whereClause,
      orderBy: [
        { isGlobal: 'desc' }, // Global categories first
        { name: 'asc' }
      ],
      select: {
        displayId: true,
        name: true,
        description: true,
        isGlobal: true,
        emoji: true
      }
    });

    const data = categories.map(cat => [
      cat.displayId,
      cat.name,
      cat.description || '',
      cat.isGlobal ? 'Global' : 'Salon-Specific',
      cat.emoji
    ]);

    // Helper function to escape CSV fields
    const escapeCSVField = (field: any): string => {
      // Handle null/undefined values first
      if (field === null || field === undefined) {
        return '';
      }
      // Convert to string
      const fieldStr = String(field);
      if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
        return `"${fieldStr.replace(/"/g, '""')}"`;
      }
      return fieldStr;
    };

    return [headers, ...data]
      .map(row => row.map(escapeCSVField).join(','))
      .join('\n');
  }
}
