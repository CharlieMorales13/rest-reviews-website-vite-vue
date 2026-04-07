import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.config';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'REST Reviews API',
            version: '1.0.0',
            description: 'API for Managing Establishments and Reviews',
        },
        servers: [
            {
                url: `http://localhost:${env.PORT}/api`,
                description: 'Local Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                RegisterUserInput: {
                    type: 'object',
                    required: ['name', 'email', 'password', 'role'],
                    properties: {
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 6 },
                        role: { type: 'string', enum: ['student', 'manager', 'admin'] }
                    }
                },
                LoginUserInput: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string' },
                        password: { type: 'string' }
                    }
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                email: { type: 'string' },
                                role: { type: 'string' },
                                token: { type: 'string' }
                            }
                        }
                    }
                },
                CreateReviewInput: {
                    type: 'object',
                    required: ['userId', 'establishmentId', 'foodScore', 'serviceScore', 'priceScore', 'comment'],
                    properties: {
                        userId: { type: 'string' },
                        establishmentId: { type: 'string' },
                        foodScore: { type: 'integer' },
                        serviceScore: { type: 'integer' },
                        priceScore: { type: 'integer' },
                        comment: { type: 'string' }
                    }
                },
                ReviewResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                establishmentId: { type: 'string' },
                                foodScore: { type: 'integer' },
                                serviceScore: { type: 'integer' },
                                priceScore: { type: 'integer' },
                                createdAt: { type: 'string', format: 'date-time' }
                            }
                        }
                    }
                },
                CreateEstablishmentInput: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: { type: 'string', maxLength: 150 },
                        description: { type: 'string', maxLength: 500 },
                        category: { type: 'string', maxLength: 80 },
                        managerId: { type: 'string', format: 'uuid' }
                    }
                },
                UpdateEstablishmentInput: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', maxLength: 150 },
                        description: { type: 'string', maxLength: 500 },
                        category: { type: 'string', maxLength: 80 },
                        managerId: { type: 'string', format: 'uuid' },
                        isActive: { type: 'boolean' }
                    }
                },
                EstablishmentResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                description: { type: 'string' },
                                category: { type: 'string' },
                                managerId: { type: 'string' },
                                isActive: { type: 'boolean' },
                                createdAt: { type: 'string', format: 'date-time' },
                                updatedAt: { type: 'string', format: 'date-time' }
                            }
                        }
                    }
                },
                UpdateUserInput: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['student', 'manager', 'admin'] },
                        isActive: { type: 'boolean' },
                        password: { type: 'string', minLength: 6 }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Paths to files containing OpenAPI documentation comments
    apis: ['./src/infrastructure/http/routes/*.ts', './src/infrastructure/http/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
