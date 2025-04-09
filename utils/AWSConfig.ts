"use client"

import { S3Client } from "@aws-sdk/client-s3"

// AWS S3 configuration
const s3Config = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || ""
  }
}

// Initialize S3 client
const s3Client = new S3Client(s3Config)

// Bucket name
const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || "ats-checker-bucket"

export { s3Client, bucketName }