# Resume Analysis API

A Node.js/Express API for resume parsing and analysis using AI, with MongoDB for data storage and AWS S3 for file handling.

## Features

- Resume parsing and analysis using Google's Generative AI (Gemini)
- File storage with AWS S3
- User authentication with Firebase
- Role-based access control (Admin, Recruiter, User)
- Resume deduplication checking
- Job posting and candidate matching
- Rate limiting and security measures

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Storage**: AWS S3
- **Authentication**: Firebase Admin
- **AI**: Google Generative AI (Gemini)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB instance
- AWS S3 bucket
- Firebase project
- Google Cloud project (for Gemini API)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# AWS
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
S3_BUCKET_NAME=your_bucket_name

# Google AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd api
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your environment variables).

## Production

Build and start the production server:
```bash
npm run build
npm start
```

## API Documentation
## Authentication APIs

### User Management
| Endpoint | Method | Description | Auth Required |
|----------|---------|-------------|---------------|
| `/api/auth/create-from-auth` | POST | Create new user from Firebase auth | No |
| `/api/auth/me` | GET | Get current user profile | Yes |
| `/api/auth/me` | PUT | Update user profile | Yes |
| `/api/auth/users` | GET | List all users (Admin only) | Yes |
| `/api/auth/users/role` | PUT | Update user role (Admin only) | Yes |

## Resume APIs

### Resume Management
| Endpoint | Method | Description | Auth Required |
|----------|---------|-------------|---------------|
| `/api/resumes` | POST | Upload & analyze new resume | Yes |
| `/api/resumes` | GET | Get all user resumes | Yes |
| `/api/resumes/:id` | GET | Get specific resume | Yes |
| `/api/resumes/:id` | DELETE | Delete resume | Yes |
| `/api/resumes/check-duplicate` | POST | Check for duplicate resume | Yes |
| `/api/resumes/admin/all` | GET | Get all resumes (Admin only) | Yes |

## Job APIs

### Job Posting
| Endpoint | Method | Description | Auth Required |
|----------|---------|-------------|---------------|
| `/api/jobs` | GET | List all job postings | No |
| `/api/jobs` | POST | Create new job posting | Yes |
| `/api/jobs/:id` | GET | Get specific job | No |
| `/api/jobs/:id` | PUT | Update job posting | Yes |
| `/api/jobs/:id` | DELETE | Delete job posting | Yes |

### Candidate Management
| Endpoint | Method | Description | Auth Required |
|----------|---------|-------------|---------------|
| `/api/jobs/:id/candidates` | GET | List job candidates | Yes |
| `/api/jobs/:id/candidates` | PUT | Update candidates list | Yes |
| `/api/jobs/:id/candidates/:candidateId/status` | PUT | Update candidate status | Yes |

## Vendor APIs

### Vendor Management
| Endpoint | Method | Description | Auth Required |
|----------|---------|-------------|---------------|
| `/api/vendors` | GET | List all vendors | Yes |
| `/api/vendors` | POST | Create new vendor | Yes |
| `/api/vendors/:id` | GET | Get specific vendor | Yes |
| `/api/vendors/:id` | PUT | Update vendor | Yes |
| `/api/vendors/:id` | DELETE | Delete vendor | Yes |

For more details on API usage and response formats, refer to the [API Documentation](API.md).


## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build the project
- `npm start` - Start production server
- `node scripts/make-admin.js` - Make a user admin
- `node scripts/check-user.js` - Check user details
- `node scripts/fix-users.js` - Fix duplicate users
- `node scripts/fix-resumes.js` - Fix resumes

## Folder Structure

```
.
├── src/
│   └── server.ts              # Main application entry point
├── routes/
│   ├── auth.ts               # Authentication routes
│   ├── resume.ts             # Resume management routes
│   ├── job.ts               # Job posting routes
│   └── vendor.ts            # Vendor management routes
├── controllers/
│   ├── authController.ts     # Authentication logic
│   ├── resumeController.ts   # Resume management logic
│   ├── jobController.ts      # Job posting logic
│   └── vendorController.ts   # Vendor management logic
├── models/
│   ├── User.ts              # User model schema
│   ├── Resume.ts            # Resume model schema
│   ├── Job.ts              # Job model schema
│   └── JobCandidate.ts      # Job candidate model schema
├── middlewares/
│   ├── authMiddleware.ts    # Authentication middleware
│   └── errorMiddleware.ts   # Error handling middleware
├── config/
│   ├── cors.ts             # CORS configuration
│   └── aws.ts              # AWS configuration
├── utils/
│   ├── analyze-resume.ts    # Resume analysis utilities
│   └── helpers.ts          # Helper functions
└── scripts/
    ├── make-admin.js       # Admin user creation script
    ├── check-user.js       # User verification script
    └── fix-users.js        # User data repair script
```



## Models

### Resume
- Stores resume data and analysis
- Includes file information, user details, and AI analysis results

### Job
- Stores job posting information
- Includes requirements, benefits, and candidate tracking

### User
- Stores user information
- Handles role-based access control

### JobCandidate
- Stores candidate information for job applications
- Includes matching analysis and tracking data

## Security Features

### Rate Limiting
- 1000 requests per 15 minutes
- Applies to all endpoints
- Status 429 when exceeded
- CORS protection
- Rate limiting
- Helmet security headers
- Authentication middleware
- Role-based access control

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC License