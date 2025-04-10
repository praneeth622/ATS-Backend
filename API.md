# API Documentation and Project Structure

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

## API Routes Documentation

### Authentication Routes (`/api/auth`)

#### User Management
```http
POST /api/auth/create-from-auth
```
- Creates a new user from Firebase authentication
- Body: `{ uid: string, email: string, displayName?: string }`

```http
GET /api/auth/me
```
- Retrieves current user profile
- Requires: Authentication token

```http
PUT /api/auth/me
```
- Updates current user profile
- Body: `{ displayName?: string, email?: string }`
- Requires: Authentication token

#### Admin Routes
```http
GET /api/auth/users
```
- Retrieves all users
- Requires: Admin role

```http
PUT /api/auth/users/role
```
- Updates user role
- Body: `{ uid: string, role: 'admin' | 'user' | 'recruiter' }`
- Requires: Admin role

### Resume Routes (`/api/resumes`)

#### Resume Management
```http
POST /api/resumes
```
- Uploads and analyzes a new resume
- Body: `multipart/form-data` with resume file
- Returns: Analyzed resume data

```http
GET /api/resumes
```
- Retrieves all resumes for current user
- Query params: `{ page?: number, limit?: number }`
- Requires: Authentication

```http
GET /api/resumes/:id
```
- Retrieves specific resume by ID
- Params: `id: string`
- Requires: Authentication

```http
DELETE /api/resumes/:id
```
- Deletes specific resume
- Params: `id: string`
- Requires: Authentication

#### Resume Analysis
```http
POST /api/resumes/check-duplicate
```
- Checks for duplicate resume
- Body: `{ fileHash: string }`
- Returns: Duplicate status

```http
GET /api/resumes/admin/all
```
- Retrieves all resumes in system
- Requires: Admin role

### Job Routes (`/api/jobs`)

#### Job Posting
```http
GET /api/jobs
```
- Retrieves all job postings
- Query params: `{ page?: number, limit?: number, status?: string }`

```http
POST /api/jobs
```
- Creates new job posting
- Body: Job details
- Requires: Authentication

```http
GET /api/jobs/:id
```
- Retrieves specific job posting
- Params: `id: string`

```http
PUT /api/jobs/:id
```
- Updates job posting
- Params: `id: string`
- Body: Updated job details
- Requires: Authentication

```http
DELETE /api/jobs/:id
```
- Deletes job posting
- Params: `id: string`
- Requires: Authentication

#### Candidate Management
```http
GET /api/jobs/:id/candidates
```
- Retrieves candidates for specific job
- Params: `id: string`

```http
PUT /api/jobs/:id/candidates
```
- Updates job candidates
- Params: `id: string`
- Body: `{ candidates: Array<CandidateData> }`

```http
PUT /api/jobs/:id/candidates/:candidateId/status
```
- Updates candidate status
- Params: `id: string, candidateId: string`
- Body: `{ status: string }`

### Vendor Routes (`/api/vendors`)

```http
GET /api/vendors
```
- Retrieves all vendors
- Requires: Authentication

```http
POST /api/vendors
```
- Creates new vendor
- Body: Vendor details
- Requires: Authentication

```http
GET /api/vendors/:id
```
- Retrieves specific vendor
- Params: `id: string`
- Requires: Authentication

```http
PUT /api/vendors/:id
```
- Updates vendor information
- Params: `id: string`
- Body: Updated vendor details
- Requires: Authentication

```http
DELETE /api/vendors/:id
```
- Deletes vendor
- Params: `id: string`
- Requires: Authentication

## Authentication

All protected routes require a valid Firebase authentication token in the Authorization header:
```http
Authorization: Bearer <firebase_token>
```

## Response Formats

### Success Response
```json
{
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

- Window: 15 minutes
- Max requests per window: 1000
- Applies to all routes

## CORS Configuration

- Allows all origins (configurable)
- Supports credentials
- Allows common HTTP methods
- Maximum age: 24 hours