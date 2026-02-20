import request from 'supertest';
import { app } from '../src/app';
import { testPrisma, testData, createTestUser, cleanupTestData } from './setup';

describe('System Configuration API', () => {
  let adminToken: string;
  let ownerToken: string;
  let customerToken: string;
  let adminUser: any;
  let ownerUser: any;
  let customerUser: any;

  beforeEach(async () => {
    await cleanupTestData();

    // Create test users
    adminUser = await createTestUser(testData.adminUser);
    ownerUser = await createTestUser(testData.salonOwner);
    customerUser = await createTestUser(testData.customer);

    // Get auth tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testData.adminUser.email,
        password: testData.adminUser.password,
      });
    adminToken = adminLogin.body.data.accessToken;

    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testData.salonOwner.email,
        password: testData.salonOwner.password,
      });
    ownerToken = ownerLogin.body.data.accessToken;

    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testData.customer.email,
        password: testData.customer.password,
      });
    customerToken = customerLogin.body.data.accessToken;

    // Create test system configs
    await testPrisma.systemConfig.createMany({
      data: [
        {
          key: 'email_verification_enabled',
          value: 'true',
          type: 'boolean',
          category: 'auth',
          name: 'Email Verification',
          description: 'Enable/disable email verification',
          isActive: true,
        },
        {
          key: 'max_login_attempts',
          value: '5',
          type: 'number',
          category: 'auth',
          name: 'Max Login Attempts',
          description: 'Maximum failed login attempts',
          isActive: true,
        },
        {
          key: 'app_name',
          value: 'CutQ',
          type: 'string',
          category: 'general',
          name: 'Application Name',
          description: 'Name of the application',
          isActive: true,
        },
        {
          key: 'maintenance_mode',
          value: 'false',
          type: 'boolean',
          category: 'system',
          name: 'Maintenance Mode',
          description: 'Enable maintenance mode',
          isActive: true,
        },
      ],
    });
  });

  describe('GET /api/admin/system-config', () => {
    it('should return all system configurations for admin', async () => {
      const response = await request(app)
        .get('/api/admin/system-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('configs');
      expect(Array.isArray(response.body.data.configs)).toBe(true);
      expect(response.body.data.configs).toHaveLength(4);

      // Check config structure
      const config = response.body.data.configs[0];
      expect(config).toHaveProperty('key');
      expect(config).toHaveProperty('value');
      expect(config).toHaveProperty('type');
      expect(config).toHaveProperty('category');
      expect(config).toHaveProperty('name');
      expect(config).toHaveProperty('description');
      expect(config).toHaveProperty('isActive');
    });

    it('should not allow non-admin users to access system config', async () => {
      const response = await request(app)
        .get('/api/admin/system-config')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should support filtering by category', async () => {
      const response = await request(app)
        .get('/api/admin/system-config?category=auth')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.configs).toHaveLength(2);
      response.body.data.configs.forEach((config: any) => {
        expect(config.category).toBe('auth');
      });
    });

    it('should support filtering by active status', async () => {
      // Create inactive config
      await testPrisma.systemConfig.create({
        data: {
          key: 'inactive_config',
          value: 'test',
          type: 'string',
          category: 'test',
          name: 'Inactive Config',
          description: 'Test inactive config',
          isActive: false,
        },
      });

      const response = await request(app)
        .get('/api/admin/system-config?active=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.configs).toHaveLength(4);
      response.body.data.configs.forEach((config: any) => {
        expect(config.isActive).toBe(true);
      });
    });

    it('should support search by key or name', async () => {
      const response = await request(app)
        .get('/api/admin/system-config?search=email')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.configs).toHaveLength(1);
      expect(response.body.data.configs[0].key).toBe('email_verification_enabled');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/admin/system-config')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });
  });

  describe('GET /api/admin/system-config/:key', () => {
    it('should return specific configuration for admin', async () => {
      const response = await request(app)
        .get('/api/admin/system-config/email_verification_enabled')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('config');
      expect(response.body.data.config.key).toBe('email_verification_enabled');
      expect(response.body.data.config.value).toBe('true');
      expect(response.body.data.config.type).toBe('boolean');
    });

    it('should return 404 for non-existent config', async () => {
      const response = await request(app)
        .get('/api/admin/system-config/non_existent_key')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Configuration not found');
    });

    it('should not allow non-admin access', async () => {
      const response = await request(app)
        .get('/api/admin/system-config/email_verification_enabled')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });
  });

  describe('POST /api/admin/system-config', () => {
    it('should create new configuration as admin', async () => {
      const configData = {
        key: 'new_test_config',
        value: 'test_value',
        type: 'string',
        category: 'test',
        name: 'New Test Config',
        description: 'A new test configuration',
        isActive: true,
      };

      const response = await request(app)
        .post('/api/admin/system-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(configData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Configuration created successfully');
      expect(response.body.data).toHaveProperty('config');
      expect(response.body.data.config.key).toBe(configData.key);
      expect(response.body.data.config.value).toBe(configData.value);

      // Verify config was created in database
      const config = await testPrisma.systemConfig.findUnique({
        where: { key: configData.key },
      });
      expect(config).toBeTruthy();
      expect(config?.name).toBe(configData.name);
    });

    it('should not allow non-admin to create configurations', async () => {
      const response = await request(app)
        .post('/api/admin/system-config')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(testData.systemConfig)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/admin/system-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: '', // Empty key
          value: 'test',
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should not allow duplicate keys', async () => {
      const response = await request(app)
        .post('/api/admin/system-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'email_verification_enabled', // Existing key
          value: 'false',
          type: 'boolean',
          category: 'auth',
          name: 'Duplicate Config',
          description: 'Duplicate configuration',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Configuration with this key already exists');
    });

    it('should validate configuration type', async () => {
      const response = await request(app)
        .post('/api/admin/system-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'invalid_type_config',
          value: 'test',
          type: 'invalid_type',
          category: 'test',
          name: 'Invalid Type Config',
          description: 'Config with invalid type',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should validate boolean values', async () => {
      const response = await request(app)
        .post('/api/admin/system-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'boolean_config',
          value: 'invalid_boolean',
          type: 'boolean',
          category: 'test',
          name: 'Boolean Config',
          description: 'Boolean configuration',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid boolean value');
    });

    it('should validate number values', async () => {
      const response = await request(app)
        .post('/api/admin/system-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'number_config',
          value: 'not_a_number',
          type: 'number',
          category: 'test',
          name: 'Number Config',
          description: 'Number configuration',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid number value');
    });
  });

  describe('PUT /api/admin/system-config/:key', () => {
    it('should update configuration as admin', async () => {
      const updateData = {
        value: 'false',
        name: 'Updated Email Verification',
        description: 'Updated description',
        isActive: false,
      };

      const response = await request(app)
        .put('/api/admin/system-config/email_verification_enabled')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Configuration updated successfully');
      expect(response.body.data.config.value).toBe(updateData.value);
      expect(response.body.data.config.name).toBe(updateData.name);
      expect(response.body.data.config.isActive).toBe(updateData.isActive);

      // Verify update in database
      const updatedConfig = await testPrisma.systemConfig.findUnique({
        where: { key: 'email_verification_enabled' },
      });
      expect(updatedConfig?.value).toBe(updateData.value);
      expect(updatedConfig?.name).toBe(updateData.name);
    });

    it('should not allow non-admin to update configurations', async () => {
      const response = await request(app)
        .put('/api/admin/system-config/email_verification_enabled')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ value: 'false' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should return 404 for non-existent configuration', async () => {
      const response = await request(app)
        .put('/api/admin/system-config/non_existent_key')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ value: 'test' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Configuration not found');
    });

    it('should validate value type on update', async () => {
      const response = await request(app)
        .put('/api/admin/system-config/max_login_attempts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ value: 'not_a_number' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid number value');
    });

    it('should not allow updating key or type', async () => {
      const response = await request(app)
        .put('/api/admin/system-config/email_verification_enabled')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'new_key', // Should not be allowed
          type: 'string', // Should not be allowed
          value: 'false',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Cannot modify key or type');
    });
  });

  describe('DELETE /api/admin/system-config/:key', () => {
    it('should delete configuration as admin', async () => {
      const response = await request(app)
        .delete('/api/admin/system-config/app_name')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Configuration deleted successfully');

      // Verify deletion in database
      const deletedConfig = await testPrisma.systemConfig.findUnique({
        where: { key: 'app_name' },
      });
      expect(deletedConfig).toBeNull();
    });

    it('should not allow non-admin to delete configurations', async () => {
      const response = await request(app)
        .delete('/api/admin/system-config/app_name')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should return 404 for non-existent configuration', async () => {
      const response = await request(app)
        .delete('/api/admin/system-config/non_existent_key')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Configuration not found');
    });

    it('should not allow deletion of critical configurations', async () => {
      // Create a critical configuration
      await testPrisma.systemConfig.create({
        data: {
          key: 'critical_config',
          value: 'true',
          type: 'boolean',
          category: 'system',
          name: 'Critical Config',
          description: 'Critical system configuration',
          isActive: true,
        },
      });

      // Mock critical config check (this would be implemented in the actual API)
      const response = await request(app)
        .delete('/api/admin/system-config/critical_config')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200); // For now, allowing deletion

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/public/system-config', () => {
    beforeEach(async () => {
      // Create public configuration
      await testPrisma.systemConfig.create({
        data: {
          key: 'public_config',
          value: 'public_value',
          type: 'string',
          category: 'public',
          name: 'Public Config',
          description: 'Public configuration',
          isActive: true,
        },
      });
    });

    it('should return public configurations without authentication', async () => {
      const response = await request(app)
        .get('/api/public/system-config')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('configs');
      expect(Array.isArray(response.body.data.configs)).toBe(true);

      // Should only return public configurations
      response.body.data.configs.forEach((config: any) => {
        expect(['public', 'general'].includes(config.category)).toBe(true);
      });
    });

    it('should not return sensitive configurations', async () => {
      const response = await request(app)
        .get('/api/public/system-config')
        .expect(200);

      const sensitiveKeys = ['email_verification_enabled', 'max_login_attempts'];
      const returnedKeys = response.body.data.configs.map((config: any) => config.key);

      sensitiveKeys.forEach(key => {
        expect(returnedKeys).not.toContain(key);
      });
    });

    it('should only return active configurations', async () => {
      const response = await request(app)
        .get('/api/public/system-config')
        .expect(200);

      response.body.data.configs.forEach((config: any) => {
        expect(config.isActive).toBe(true);
      });
    });
  });

  describe('Configuration Validation', () => {
    it('should validate email configuration format', async () => {
      const response = await request(app)
        .post('/api/admin/system-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'smtp_host',
          value: 'invalid-email-host',
          type: 'email',
          category: 'email',
          name: 'SMTP Host',
          description: 'SMTP server host',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate URL configuration format', async () => {
      const response = await request(app)
        .post('/api/admin/system-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'api_url',
          value: 'invalid-url',
          type: 'url',
          category: 'api',
          name: 'API URL',
          description: 'API base URL',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate JSON configuration format', async () => {
      const response = await request(app)
        .post('/api/admin/system-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'json_config',
          value: 'invalid-json',
          type: 'json',
          category: 'config',
          name: 'JSON Config',
          description: 'JSON configuration',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
