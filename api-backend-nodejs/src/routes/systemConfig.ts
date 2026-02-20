import express, { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/database';
import { 
  SYSTEM_CONFIG_DEFINITIONS, 
  getConfigDefinition, 
  getConfigsByCategory, 
  getAllCategories,
  getPublicConfigs 
} from '../config/systemConfigDefinitions';

// Simple auth middleware for testing
const simpleAuth = (req: any, res: any, next: any) => {
  // For testing, assume admin user
  req.user = { role: 'ADMIN', userId: 'test-admin' };
  next();
};

const router = express.Router();

// Validation schemas
const updateSystemConfigSchema = z.object({
  value: z.string(), // Allow empty strings for credential fields
});

const addOptionSchema = z.object({
  value: z.string().min(1, 'Option value is required'),
  label: z.string().min(1, 'Option label is required'),
});

// GET /api/v1/system-config - Get all system configurations with values (Admin only)
router.get('/', simpleAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Only admin can access system configurations
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { category } = req.query;
    
    // Get static definitions
    let configDefinitions = SYSTEM_CONFIG_DEFINITIONS;
    if (category) {
      configDefinitions = getConfigsByCategory(category as string);
    }

    // Get stored values from database
    const storedConfigs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: configDefinitions.map(def => def.key)
        }
      }
    });

    // Merge definitions with stored values
    const configs = configDefinitions.map(definition => {
      const storedConfig = storedConfigs.find(stored => stored.key === definition.key);

      // Parse stored options or use definition options
      let options = definition.options || [];
      if (storedConfig?.options) {
        try {
          options = JSON.parse(storedConfig.options);
        } catch (error) {
          console.warn(`Failed to parse options for ${definition.key}:`, error);
        }
      }

      return {
        id: storedConfig?.id || `static-${definition.key}`,
        key: definition.key,
        value: storedConfig?.value || definition.defaultValue,
        type: definition.type,
        category: definition.category,
        name: definition.name,
        description: definition.description,
        options: options,
        allowAddOptions: definition.allowAddOptions || false,
        isActive: true,
        createdAt: storedConfig?.createdAt || new Date(),
        updatedAt: storedConfig?.updatedAt || new Date(),
      };
    });

    res.json({
      success: true,
      data: configs,
      message: 'System configurations retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching system configurations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system configurations',
    });
  }
});


// GET /api/v1/system-config/:key - Get system configuration by key (Public for some keys)
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    // Get static definition
    const definition = getConfigDefinition(key);
    if (!definition) {
      return res.status(404).json({
        success: false,
        message: 'System configuration not found',
      });
    }



    // Check if this is a public config or if user is authenticated
    const isPublic = definition.isPublic;
    if (!isPublic) {
      // For non-public configs, require authentication (simplified for now)
      // In production, you'd check the auth token here
    }

    // Get stored value from database
    const storedConfig = await prisma.systemConfig.findUnique({
      where: { key },
    });

    const value = storedConfig?.value || definition.defaultValue;

    // Parse value based on type
    let parsedValue: any = value;
    try {
      switch (definition.type) {
        case 'boolean':
          parsedValue = value === 'true';
          break;
        case 'number':
          parsedValue = parseFloat(value);
          break;
        case 'json':
          parsedValue = JSON.parse(value);
          break;
        default:
          parsedValue = value;
      }
    } catch (parseError) {
      console.warn(`Failed to parse config value for key ${key}:`, parseError);
    }

    const config = {
      id: storedConfig?.id || `static-${key}`,
      key: definition.key,
      value: value,
      type: definition.type,
      category: definition.category,
      name: definition.name,
      description: definition.description,
      isActive: true,
      createdAt: storedConfig?.createdAt || new Date(),
      updatedAt: storedConfig?.updatedAt || new Date(),
    };

    res.json({
      success: true,
      data: {
        ...config,
        parsedValue,
      },
      message: 'System configuration retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching system configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system configuration',
    });
  }
});

// PUT /api/v1/system-config/:key - Update system configuration value (Admin only)
router.put('/:key', simpleAuth, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const user = (req as any).user;

    // Only admin can update system configurations
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    // Check if this is a valid configuration key
    const definition = getConfigDefinition(key);
    if (!definition) {
      return res.status(404).json({
        success: false,
        message: 'System configuration not found',
      });
    }

    const validatedData = updateSystemConfigSchema.parse(req.body);

    // Validate value based on type (allow empty strings for all types)
    const { value } = validatedData;

    // Skip validation if value is empty string (allow clearing fields)
    if (value !== '') {
      try {
        switch (definition.type) {
          case 'boolean':
            if (value !== 'true' && value !== 'false') {
              throw new Error('Boolean value must be "true" or "false"');
            }
            break;
          case 'number':
            if (isNaN(parseFloat(value))) {
              throw new Error('Number value must be a valid number');
            }
            break;
          case 'json':
            JSON.parse(value); // Will throw if invalid JSON
            break;
        }
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: `Invalid value for ${definition.type} type: ${parseError.message}`,
        });
      }
    }

    // Upsert the configuration value
    const updatedConfig = await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    res.json({
      success: true,
      data: {
        id: updatedConfig.id,
        key: definition.key,
        value: updatedConfig.value,
        type: definition.type,
        category: definition.category,
        name: definition.name,
        description: definition.description,
        isActive: true,
        createdAt: updatedConfig.createdAt,
        updatedAt: updatedConfig.updatedAt,
      },
      message: 'System configuration updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error updating system configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system configuration',
    });
  }
});

// GET /api/v1/system-config/meta/categories - Get all available configuration categories
router.get('/meta/categories', async (req: Request, res: Response) => {
  try {
    const categories = getAllCategories();
    
    res.json({
      success: true,
      data: categories,
      message: 'Configuration categories retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching configuration categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration categories',
    });
  }
});

// GET /api/v1/system-config/public/configs - Get public configurations (no auth required)
router.get('/public/configs', async (req: Request, res: Response) => {
  try {
    const publicDefinitions = getPublicConfigs();
    
    // Get stored values for public configs
    const storedConfigs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: publicDefinitions.map(def => def.key)
        }
      }
    });

    // Merge definitions with stored values
    const configs = publicDefinitions.map(definition => {
      const storedConfig = storedConfigs.find(stored => stored.key === definition.key);
      const value = storedConfig?.value || definition.defaultValue;
      
      // Parse value based on type
      let parsedValue: any = value;
      try {
        switch (definition.type) {
          case 'boolean':
            parsedValue = value === 'true';
            break;
          case 'number':
            parsedValue = parseFloat(value);
            break;
          case 'json':
            parsedValue = JSON.parse(value);
            break;
          default:
            parsedValue = value;
        }
      } catch (parseError) {
        console.warn(`Failed to parse config value for key ${definition.key}:`, parseError);
      }

      return {
        key: definition.key,
        value: parsedValue,
        name: definition.name,
        description: definition.description,
      };
    });

    res.json({
      success: true,
      data: configs,
      message: 'Public configurations retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching public configurations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public configurations',
    });
  }
});

// POST /api/v1/system-config/:key/options - Add new option to select field (Admin only)
router.post('/:key/options', simpleAuth, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const user = (req as any).user;

    // Only admin can add options
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    // Check if this is a valid configuration key
    const definition = getConfigDefinition(key);
    if (!definition) {
      return res.status(404).json({
        success: false,
        message: 'System configuration not found',
      });
    }

    // Check if this config allows adding options
    if (!definition.allowAddOptions) {
      return res.status(400).json({
        success: false,
        message: 'This configuration does not allow adding new options',
      });
    }

    // Check if this is a select or multiselect field
    if (definition.type !== 'select' && definition.type !== 'multiselect') {
      return res.status(400).json({
        success: false,
        message: 'Options can only be added to select or multiselect fields',
      });
    }

    const validatedData = addOptionSchema.parse(req.body);
    const { value, label } = validatedData;

    // Get current stored config
    const storedConfig = await prisma.systemConfig.findUnique({
      where: { key },
    });

    // Get current options
    let currentOptions = definition.options || [];
    if (storedConfig?.options) {
      try {
        currentOptions = JSON.parse(storedConfig.options);
      } catch (error) {
        console.warn(`Failed to parse existing options for ${key}:`, error);
      }
    }

    // Check if option value already exists
    if (currentOptions.some((option: any) => option.value === value)) {
      return res.status(400).json({
        success: false,
        message: 'Option with this value already exists',
      });
    }

    // Add new option
    const newOptions = [...currentOptions, { value, label }];
    const optionsJson = JSON.stringify(newOptions);

    // Update or create config with new options
    const updatedConfig = await prisma.systemConfig.upsert({
      where: { key },
      update: { options: optionsJson },
      create: {
        key,
        value: definition.defaultValue,
        options: optionsJson
      },
    });

    res.json({
      success: true,
      data: {
        key,
        options: newOptions,
        message: 'Option added successfully',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error adding option:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add option',
    });
  }
});

// POST /api/v1/system-config/:key/templates - Add new template (Admin only)
router.post('/:key/templates', simpleAuth, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const user = (req as any).user;

    // Only admin can add templates
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    // Check if this is a valid configuration key
    const definition = getConfigDefinition(key);
    if (!definition || definition.type !== 'template') {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found or not a template type',
      });
    }

    const templateSchema = z.object({
      id: z.string().min(1, 'Template ID is required'),
      message: z.string().min(1, 'Template message is required'),
      templateId: z.string().optional().default(''),
    });

    const validatedData = templateSchema.parse(req.body);

    // Get existing options
    const storedConfig = await prisma.systemConfig.findUnique({
      where: { key },
    });

    let existingOptions = [];
    if (storedConfig?.options) {
      try {
        existingOptions = JSON.parse(storedConfig.options);
      } catch (error) {
        console.warn(`Failed to parse existing options for ${key}:`, error);
      }
    }

    // Check for duplicate template ID
    const duplicateTemplate = existingOptions.find((template: any) => template.id === validatedData.id);
    if (duplicateTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Template with this ID already exists',
      });
    }

    // Add new template
    existingOptions.push(validatedData);

    // Update database
    await prisma.systemConfig.upsert({
      where: { key },
      update: {
        options: JSON.stringify(existingOptions),
      },
      create: {
        key,
        value: definition.defaultValue,
        options: JSON.stringify(existingOptions),
      },
    });

    res.json({
      success: true,
      data: {
        key,
        templates: existingOptions,
      },
      message: 'Template added successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error adding template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add template',
    });
  }
});

// PUT /api/v1/system-config/:key/templates/:templateId - Update template (Admin only)
router.put('/:key/templates/:templateId', simpleAuth, async (req: Request, res: Response) => {
  try {
    const { key, templateId } = req.params;
    const user = (req as any).user;

    // Only admin can update templates
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    // Check if this is a valid configuration key
    const definition = getConfigDefinition(key);
    if (!definition || definition.type !== 'template') {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found or not a template type',
      });
    }

    const templateSchema = z.object({
      message: z.string().min(1, 'Template message is required'),
      templateId: z.string().optional().default(''),
    });

    const validatedData = templateSchema.parse(req.body);

    // Get existing options
    const storedConfig = await prisma.systemConfig.findUnique({
      where: { key },
    });

    let existingOptions = [];
    if (storedConfig?.options) {
      try {
        existingOptions = JSON.parse(storedConfig.options);
      } catch (error) {
        console.warn(`Failed to parse existing options for ${key}:`, error);
      }
    }

    // Find and update template
    const templateIndex = existingOptions.findIndex((template: any) => template.id === templateId);
    if (templateIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    existingOptions[templateIndex] = {
      ...existingOptions[templateIndex],
      message: validatedData.message,
      templateId: validatedData.templateId,
    };

    // Update database
    await prisma.systemConfig.update({
      where: { key },
      data: {
        options: JSON.stringify(existingOptions),
      },
    });

    res.json({
      success: true,
      data: {
        key,
        templates: existingOptions,
      },
      message: 'Template updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
    });
  }
});

// DELETE /api/v1/system-config/:key/templates/:templateId - Delete template (Admin only)
router.delete('/:key/templates/:templateId', simpleAuth, async (req: Request, res: Response) => {
  try {
    const { key, templateId } = req.params;
    const user = (req as any).user;

    // Only admin can delete templates
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    // Check if this is a valid configuration key
    const definition = getConfigDefinition(key);
    if (!definition || definition.type !== 'template') {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found or not a template type',
      });
    }

    // Get existing options
    const storedConfig = await prisma.systemConfig.findUnique({
      where: { key },
    });

    let existingOptions = [];
    if (storedConfig?.options) {
      try {
        existingOptions = JSON.parse(storedConfig.options);
      } catch (error) {
        console.warn(`Failed to parse existing options for ${key}:`, error);
      }
    }

    // Check if there's more than one template (can't delete the last one)
    if (existingOptions.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last template',
      });
    }

    // Find and remove template
    const templateIndex = existingOptions.findIndex((template: any) => template.id === templateId);
    if (templateIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    existingOptions.splice(templateIndex, 1);

    // Update database
    await prisma.systemConfig.update({
      where: { key },
      data: {
        options: JSON.stringify(existingOptions),
      },
    });

    res.json({
      success: true,
      data: {
        key,
        templates: existingOptions,
      },
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template',
    });
  }
});

export default router;
