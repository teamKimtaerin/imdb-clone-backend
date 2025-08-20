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
      },
      Movie: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: '영화 고유 ID'
          },
          title: {
            type: 'string',
            description: '영화 제목',
            example: '아바타'
          },
          categories: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: '영화 장르',
            example: ['액션', 'SF']
          },
          running_time: {
            type: 'number',
            description: '상영 시간 (분)',
            example: 162
          },
          release_date: {
            type: 'string',
            format: 'date',
            description: '개봉일',
            example: '2009-12-18'
          },
          rating_total: {
            type: 'number',
            description: '총 평점',
            example: 0
          },
          review_count: {
            type: 'number',
            description: '리뷰 개수',
            example: 0
          },
          audience: {
            type: 'number',
            description: '관객 수',
            example: 0
          },
          trailer_url: {
            type: 'string',
            description: '트레일러 URL',
            example: 'https://youtube.com/watch?v=example'
          },
          description: {
            type: 'string',
            description: '영화 설명',
            example: '판도라라는 행성에서 벌어지는 이야기'
          },
          cast: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: '샘 워딩턴'
                },
                role: {
                  type: 'string',
                  example: '제이크 설리'
                },
                profile_image: {
                  type: 'string',
                  example: 'https://image.tmdb.org/t/p/w500/example.jpg'
                }
              }
            },
            description: '출연진'
          },
          director: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: '제임스 카메론'
              },
              profile_image: {
                type: 'string',
                example: 'https://image.tmdb.org/t/p/w500/example.jpg'
              }
            },
            description: '감독 정보'
          },
          is_adult_content: {
            type: 'boolean',
            description: '18등급 여부 (블러 효과용)',
            example: false
          },
          poster_url: {
            type: 'string',
            description: '포스터 URL',
            example: 'https://example.com/poster.jpg'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: '생성일시'
          }
        }
      },
      MovieRequest: {
        type: 'object',
        required: ['title', 'categories', 'running_time', 'release_date'],
        properties: {
          title: {
            type: 'string',
            example: '아바타'
          },
          categories: {
            type: 'array',
            items: {
              type: 'string'
            },
            example: ['액션', 'SF']
          },
          running_time: {
            type: 'number',
            example: 162
          },
          release_date: {
            type: 'string',
            format: 'date',
            example: '2009-12-18'
          },
          trailer_url: {
            type: 'string',
            example: 'https://youtube.com/watch?v=example'
          },
          description: {
            type: 'string',
            example: '판도라라는 행성에서 벌어지는 이야기'
          },
          cast: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: '샘 워딩턴'
                },
                role: {
                  type: 'string',
                  example: '제이크 설리'
                },
                profile_image: {
                  type: 'string',
                  example: 'https://image.tmdb.org/t/p/w500/example.jpg'
                }
              }
            }
          },
          director: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: '제임스 카메론'
              },
              profile_image: {
                type: 'string',
                example: 'https://image.tmdb.org/t/p/w500/example.jpg'
              }
            }
          },
          poster_url: {
            type: 'string',
            example: 'https://example.com/poster.jpg'
          }
        }
      },
      Review: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: '리뷰 고유 ID'
          },
          title: {
            type: 'string',
            description: '리뷰 제목',
            example: '정말 재미있는 영화였습니다'
          },
          rating: {
            type: 'number',
            description: '평점 (1-10)',
            example: 9
          },
          content: {
            type: 'string',
            description: '리뷰 내용',
            example: '스토리와 영상미가 뛰어납니다'
          },
          is_spoiler: {
            type: 'boolean',
            description: '스포일러 여부',
            example: false
          },
          user: {
            type: 'object',
            properties: {
              user_id: {
                type: 'string',
                description: '사용자 ID'
              },
              nickname: {
                type: 'string',
                description: '사용자 닉네임',
                example: '영화팬123'
              }
            }
          },
          movie: {
            type: 'object',
            properties: {
              movie_id: {
                type: 'string',
                description: '영화 ID'
              },
              release_date: {
                type: 'string',
                format: 'date',
                description: '영화 개봉일'
              },
              running_time: {
                type: 'number',
                description: '영화 상영시간'
              }
            }
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: '리뷰 작성일시'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: '리뷰 수정일시'
          }
        }
      },
      ReviewRequest: {
        type: 'object',
        required: ['userId', 'rating'],
        properties: {
          userId: {
            type: 'string',
            description: '사용자 ID',
            example: '507f1f77bcf86cd799439011'
          },
          nickname: {
            type: 'string',
            description: '사용자 닉네임',
            example: '영화팬123'
          },
          title: {
            type: 'string',
            description: '리뷰 제목',
            example: '정말 재미있는 영화였습니다'
          },
          rating: {
            type: 'number',
            description: '평점 (1-10)',
            minimum: 1,
            maximum: 10,
            example: 9
          },
          content: {
            type: 'string',
            description: '리뷰 내용',
            example: '스토리와 영상미가 뛰어납니다'
          },
          comment: {
            type: 'string',
            description: '리뷰 댓글 (content 대신 사용 가능)',
            example: '스토리와 영상미가 뛰어납니다'
          },
          is_spoiler: {
            type: 'boolean',
            description: '스포일러 여부',
            example: false
          }
        }
      },
      ReviewUpdateRequest: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: '리뷰 제목',
            example: '수정된 리뷰 제목'
          },
          rating: {
            type: 'number',
            description: '평점 (1-10)',
            minimum: 1,
            maximum: 10,
            example: 8
          },
          content: {
            type: 'string',
            description: '리뷰 내용',
            example: '수정된 리뷰 내용입니다'
          },
          is_spoiler: {
            type: 'boolean',
            description: '스포일러 여부',
            example: true
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