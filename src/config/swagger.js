const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger 정의
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'IMDB Clone API',
    version: '1.0.0',
    description: '영화 리뷰 및 사용자 관리 API',
    contact: {
      name: '개발자',
      email: 'dev@example.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['username', 'email', 'password', 'nickname'],
        properties: {
          id: {
            type: 'string',
            description: '사용자 고유 ID'
          },
          username: {
            type: 'string',
            description: '사용자명',
            minLength: 3,
            maxLength: 20
          },
          email: {
            type: 'string',
            format: 'email',
            description: '이메일 주소'
          },
          password: {
            type: 'string',
            description: '비밀번호',
            minLength: 6
          },
          nickname: {
            type: 'string',
            description: '닉네임',
            maxLength: 30
          },
          profileImageUrl: {
            type: 'string',
            format: 'uri',
            description: '프로필 이미지 URL'
          },
          preferences: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: '선호 장르 목록',
            maxItems: 5
          },
          recentSearches: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: '최근 검색 기록',
            maxItems: 10
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: '생성일시'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: '수정일시'
          }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['username', 'email', 'password', 'nickname'],
        properties: {
          username: {
            type: 'string',
            example: 'testuser'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'test@example.com'
          },
          password: {
            type: 'string',
            example: '123456'
          },
          nickname: {
            type: 'string',
            example: '테스트유저'
          }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'test@example.com'
          },
          password: {
            type: 'string',
            example: '123456'
          }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: '로그인 성공'
          },
          data: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              },
              user: {
                $ref: '#/components/schemas/User'
              }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: '오류 메시지'
          },
          error: {
            type: 'string',
            example: '상세 오류 정보'
          }
        }
      }
    }
  }
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.js'], // JSDoc 주석이 있는 라우트 파일들
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec
};