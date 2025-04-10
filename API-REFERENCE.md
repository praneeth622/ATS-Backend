# API Reference


## Request/Response Examples

### Authentication
```http
POST /api/auth/create-from-auth
Body: {
  "uid": "firebase_uid",
  "email": "user@example.com",
  "displayName": "John Doe"
}
```

### Resume Upload
```http
POST /api/resumes
Content-Type: multipart/form-data
Body: {
  "file": <resume_file>,
  "metadata": {
    "title": "Software Engineer Resume",
    "type": "application/pdf"
  }
}
```

### Job Creation
```http
POST /api/jobs
Body: {
  "title": "Senior Software Engineer",
  "description": "Job description...",
  "requirements": ["5+ years experience", "Node.js"],
  "location": "Remote",
  "type": "Full-time"
}
```

### Vendor Creation
```http
POST /api/vendors
Body: {
  "name": "Tech Recruiters Inc",
  "email": "contact@techrecruiters.com",
  "phone": "+1234567890",
  "address": "123 Business St"
}
```

## Common Response Formats

### Success Response
```json
{
  "data": {
    "id": "123",
    "attribute": "value"
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

## Authentication

All protected routes require Firebase token:
```http
Authorization: Bearer <firebase_token>
```

## Rate Limits
- 1000 requests per 15 minutes
- Applies to all endpoints
- Status 429 when exceeded

## Notes
- All dates are in ISO 8601 format
- File uploads limited to 10MB
- Supported resume formats: PDF, DOCX
- All responses are JSON