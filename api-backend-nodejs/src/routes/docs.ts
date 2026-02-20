import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Load and parse the swagger.yaml file
const swaggerPath = path.join(__dirname, '../../swagger.yaml');

// Function to load swagger document
const loadSwaggerDocument = () => {
  try {
    const swaggerFile = fs.readFileSync(swaggerPath, 'utf8');
    const swaggerDocument = yaml.parse(swaggerFile);
    // console.log('📄 Swagger document loaded with paths:', Object.keys(swaggerDocument.paths || {}));
    return { swaggerDocument, swaggerFile };
  } catch (error) {
    console.error('❌ Error loading swagger document:', error);
    throw error;
  }
};

const { swaggerDocument, swaggerFile } = loadSwaggerDocument();

// Enhanced Swagger UI options with custom styling
const options = {
  explorer: true,
  customCss: `
    /* Import Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    /* Global Styles */
    .swagger-ui {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      min-height: 100vh;
    }

    /* Hide default topbar */
    .swagger-ui .topbar {
      display: none !important;
    }

    /* Main Container */
    .swagger-ui .wrapper {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      background: white;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      margin-top: 2rem;
      margin-bottom: 2rem;
    }

    /* API Title and Description */
    .swagger-ui .info {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 16px;
      padding: 2.5rem;
      margin: 2rem 0;
      border: 1px solid #e2e8f0;
      position: relative;
      overflow: hidden;
    }

    .swagger-ui .info::before {
      content: '🏪';
      position: absolute;
      top: 1rem;
      right: 1.5rem;
      font-size: 3rem;
      opacity: 0.1;
    }

    .swagger-ui .info .title {
      color: #1e293b !important;
      font-size: 2.5rem !important;
      font-weight: 700 !important;
      margin-bottom: 1rem !important;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .swagger-ui .info .description {
      color: #475569 !important;
      font-size: 1.1rem !important;
      line-height: 1.7 !important;
      margin-bottom: 1.5rem !important;
    }

    /* Operation Blocks */
    .swagger-ui .opblock {
      border-radius: 12px !important;
      border: 1px solid #e2e8f0 !important;
      margin-bottom: 1.5rem !important;
      overflow: hidden !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
      transition: all 0.3s ease !important;
    }

    .swagger-ui .opblock:hover {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
      transform: translateY(-2px) !important;
    }

    /* HTTP Method Colors */
    .swagger-ui .opblock.opblock-get {
      border-left: 4px solid #10b981 !important;
    }

    .swagger-ui .opblock.opblock-post {
      border-left: 4px solid #3b82f6 !important;
    }

    .swagger-ui .opblock.opblock-put {
      border-left: 4px solid #f59e0b !important;
    }

    .swagger-ui .opblock.opblock-delete {
      border-left: 4px solid #ef4444 !important;
    }

    /* Operation Headers */
    .swagger-ui .opblock .opblock-summary-method {
      border-radius: 8px !important;
      padding: 0.5rem 1rem !important;
      font-weight: 600 !important;
      font-size: 0.875rem !important;
      min-width: 80px !important;
      text-align: center !important;
    }

    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #10b981 !important;
      color: white !important;
    }

    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #3b82f6 !important;
      color: white !important;
    }

    .swagger-ui .opblock.opblock-put .opblock-summary-method {
      background: #f59e0b !important;
      color: white !important;
    }

    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: #ef4444 !important;
      color: white !important;
    }

    /* Tags (Section Headers) */
    .swagger-ui .opblock-tag {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
      color: white !important;
      padding: 1.5rem 2rem !important;
      margin: 2rem 0 1rem 0 !important;
      border-radius: 12px !important;
      font-size: 1.25rem !important;
      font-weight: 600 !important;
      border: none !important;
    }

    .swagger-ui .opblock-tag small {
      color: #cbd5e1 !important;
      font-size: 0.875rem !important;
      font-weight: 400 !important;
    }

    /* Buttons */
    .swagger-ui .btn {
      border-radius: 8px !important;
      font-weight: 500 !important;
      padding: 0.75rem 1.5rem !important;
      transition: all 0.2s ease !important;
      border: none !important;
    }

    .swagger-ui .btn.execute {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
      color: white !important;
    }

    .swagger-ui .btn.execute:hover {
      background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4) !important;
    }

    .swagger-ui .btn.try-out__btn {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      color: white !important;
    }

    .swagger-ui .btn.try-out__btn:hover {
      background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4) !important;
    }

    /* Custom Badge for Version */
    .swagger-ui .info::after {
      content: 'v1.0.0';
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .swagger-ui .wrapper {
        margin: 1rem;
        padding: 1rem;
      }

      .swagger-ui .info {
        padding: 1.5rem;
      }

      .swagger-ui .info .title {
        font-size: 2rem !important;
      }
    }
  `,
  customSiteTitle: "🏪 Salon Management API - Interactive Documentation",
  customfavIcon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏪</text></svg>",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
  }
};

// Serve Swagger UI
router.use('/', swaggerUi.serve as any);
router.get('/', (req: any, res: any, next: any) => {
  // Reload the swagger document for each request to ensure it's fresh
  const { swaggerDocument: freshDoc } = loadSwaggerDocument();
  return swaggerUi.setup(freshDoc, options)(req, res, next);
});

// JSON endpoint for the OpenAPI spec
router.get('/json', (req, res) => {
  const { swaggerDocument: freshDoc } = loadSwaggerDocument();
  res.json(freshDoc);
});

// YAML endpoint for the OpenAPI spec
router.get('/yaml', (req, res) => {
  const { swaggerFile: freshFile } = loadSwaggerDocument();
  res.type('text/yaml');
  res.send(freshFile);
});

export default router;
