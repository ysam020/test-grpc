// apps/api-gateway-service/__tests__/utils/test-helpers.ts
import { Express } from 'express';
import { Server } from 'http';
import request from 'supertest';

export class TestServer {
  private app: Express;
  private server: Server | null = null;

  constructor(app: Express) {
    this.app = app;
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(0, () => {
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          resolve();
        });
      });
    }
  }

  getRequest() {
    return request(this.app);
  }

  getPort(): number {
    if (!this.server) {
      throw new Error('Server not started');
    }
    const address = this.server.address();
    if (typeof address === 'string') {
      throw new Error('Server bound to pipe, not port');
    }
    return address?.port || 0;
  }
}

export class AuthTestHelper {
  /**
   * Generate a valid JWT token for testing
   */
  static generateValidToken(payload: any = {}): string {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        userId: '1',
        email: 'test@example.com',
        ...payload,
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  }

  /**
   * Generate an expired JWT token for testing
   */
  static generateExpiredToken(payload: any = {}): string {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        userId: '1',
        email: 'test@example.com',
        ...payload,
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' } // Already expired
    );
  }

  /**
   * Generate a refresh token for testing
   */
  static generateRefreshToken(payload: any = {}): string {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        userId: '1',
        type: 'refresh',
        ...payload,
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '7d' }
    );
  }
}

export class GrpcTestHelper {
  /**
   * Create a mock gRPC call object
   */
  static createMockCall(metadata: Record<string, string> = {}, request: any = {}) {
    return {
      metadata: new Map(Object.entries(metadata)),
      request,
      getPeer: jest.fn().mockReturnValue('127.0.0.1:12345'),
      cancelled: false,
      emit: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn(),
    };
  }

  /**
   * Create a mock gRPC callback
   */
  static createMockCallback() {
    return jest.fn().mockImplementation((error, response) => {
      if (error) {
        throw error;
      }
      return response;
    });
  }

  /**
   * Create a gRPC error with status code
   */
  static createGrpcError(code: number, message: string) {
    const error = new Error(message);
    (error as any).code = code;
    return error;
  }

  /**
   * Mock a gRPC service method response
   */
  static mockServiceResponse(
    stub: any,
    methodName: string,
    response: any,
    error: any = null
  ) {
    stub[methodName].mockImplementation((request: any, metadata: any, callback: any) => {
      // Handle both 2-arg and 3-arg callback patterns
      const cb = typeof metadata === 'function' ? metadata : callback;
      process.nextTick(() => cb(error, response));
    });
  }
}

export class DatabaseTestHelper {
  /**
   * Create mock user data
   */
  static createMockUser(overrides: any = {}) {
    return {
      id: '1',
      email: 'test@example.com',
      password: '$2b$04$hashedPassword',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Create mock product data
   */
  static createMockProduct(overrides: any = {}) {
    return {
      id: '1',
      name: 'Test Product',
      description: 'Test Product Description',
      price: 100,
      category: 'Electronics',
      inStock: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Create mock survey data
   */
  static createMockSurvey(overrides: any = {}) {
    return {
      id: '1',
      title: 'Test Survey',
      description: 'Test Survey Description',
      questions: [
        {
          id: '1',
          text: 'What is your opinion?',
          type: 'multiple_choice',
          options: ['Good', 'Bad', 'Neutral'],
        },
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Reset all database mocks
   */
  static resetMocks() {
    Object.values(global.mockDatabase).forEach((model: any) => {
      Object.values(model).forEach((method: any) => {
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    });
  }
}

export class ValidationTestHelper {
  /**
   * Test validation error cases
   */
  static async testValidationErrors(
    testRequest: any,
    endpoint: string,
    method: 'get' | 'post' | 'put' | 'delete',
    invalidData: any[],
    expectedErrors: string[]
  ) {
    for (let i = 0; i < invalidData.length; i++) {
      const response = await testRequest[method](endpoint)
        .set('Authorization', 'Bearer ' + AuthTestHelper.generateValidToken())
        .send(invalidData[i])
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining(expectedErrors[i]),
          }),
        ]),
      });
    }
  }
}

export class MockDataFactory {
  /**
   * Generate test data for load testing
   */
  static generateBulkUsers(count: number) {
    return Array.from({ length: count }, (_, index) => ({
      id: (index + 1).toString(),
      email: `user${index + 1}@example.com`,
      firstName: `User${index + 1}`,
      lastName: 'Test',
      isActive: true,
      emailVerified: true,
    }));
  }

  /**
   * Generate test data for products
   */
  static generateBulkProducts(count: number) {
    return Array.from({ length: count }, (_, index) => ({
      id: (index + 1).toString(),
      name: `Product ${index + 1}`,
      description: `Description for product ${index + 1}`,
      price: (index + 1) * 10,
      category: ['Electronics', 'Clothing', 'Books'][index % 3],
      inStock: index % 2 === 0,
    }));
  }
}