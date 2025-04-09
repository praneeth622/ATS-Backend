// import { GoogleGenerativeAI } from "@google/generative-ai"
// import apiClient from "../lib/api-client"
// import { s3Client, bucketName } from "./AWSConfig"
// import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
// import { v4 as uuidv4 } from "uuid"

// // Define an interface for resume data
// interface ResumeData {
//   _id?: string
//   fileHash: string
//   filename: string
//   filelink: string
//   analysis: any
//   vendor_id?: string
//   vendor_name?: string
//   user_id: string
// }

// // Add these interfaces at the top of the file, after the ResumeData interface
// interface DuplicateCheckResponse {
//   isDuplicate: boolean;
//   existingResume?: ResumeData;
//   message?: string;
// }

// interface SavedResumeResponse {
//   _id: string;
//   filename: string;
//   filelink: string;
//   fileHash: string;
//   analysis: any;
//   vendor_id?: string;
//   vendor_name?: string;
//   user_id: string;
//   uploaded_at: string;
//   [key: string]: any;
// }

// const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)

// export async function analyzeResume(
//   file: File,
//   userId: string,
//   userEmail: string,
//   vendorId: string | null = null,
//   vendorName: string | null = null,
// ) {
//   try {
//     const model = genAI.getGenerativeModel({
//       model: "gemini-1.5-pro",
//       generationConfig: {
//         temperature: 0.7,
//         topP: 1,
//         topK: 1,
//         maxOutputTokens: 2048,
//       },
//     })

//     const fileBuffer = await file.arrayBuffer()
//     const base64File = Buffer.from(fileBuffer).toString("base64")

//     const prompt = `You are an experienced IT recruitment specialist. Carefully analyze the attached resume and extract the following candidate's details:
//     - Name
//     - Phone number
//     - Email
//     - Social profile links
//     - Education details
//     - Work experience details
//     - Key skills (Return as a single flat array without subcategories)
//     - Project experience
//     - Profile summary (Give a brief analysis of the candidate's profile)

//     Ensure the output is in valid JSON format with no additional formatting, markdown, or code block syntax.`

//     const result = await model
//       .generateContent({
//         contents: [
//           {
//             role: "user",
//             parts: [
//               { text: prompt },
//               {
//                 inlineData: {
//                   mimeType: "application/pdf",
//                   data: base64File,
//                 },
//               },
//             ],
//           },
//         ],
//       })
//       .catch((error) => {
//         console.error("Gemini API error:", error)
//         throw new Error("Failed to analyze resume with AI model")
//       })

//     const response = await result.response
//     const responseText = await response.text()

//     // Clean the response text by removing markdown code block syntax
//     const cleanResponse = responseText
//       .replace(/```json\n?/, "")
//       .replace(/```\n?$/, "")
//       .trim()

//     let analysisJson
//     try {
//       analysisJson = JSON.parse(cleanResponse)

//       // Validate that the response contains essential resume fields
//       const isValidResume =
//         analysisJson &&
//         typeof analysisJson === "object" &&
//         (analysisJson.name || analysisJson.Name) && // Check for name field (case insensitive)
//         ((analysisJson.key_skills && Array.isArray(analysisJson.key_skills) && analysisJson.key_skills.length > 0) ||
//           (analysisJson.skills && Array.isArray(analysisJson.skills) && analysisJson.skills.length > 0))

//       if (!isValidResume) {
//         console.error("Invalid resume data from AI model:", analysisJson)
//         throw new Error("The uploaded file does not appear to be a valid resume")
//       }
//     } catch (parseError) {
//       console.error("Error parsing JSON response:", parseError)
//       throw new Error("Invalid JSON response from AI model")
//     }
    
//     // Generate file hash for duplicate checking
//     const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
//     const hashArray = Array.from(new Uint8Array(hashBuffer));
//     const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
//     // Check for duplicates using our API
//     try {
//       const duplicateCheck = await apiClient.resumes.checkDuplicate(fileHash, userId) as DuplicateCheckResponse;
//       if (duplicateCheck.isDuplicate) {
//         throw new Error('This resume has already been uploaded');
//       }
//     } catch (error) {
//       console.error("Error checking for duplicate resume:", error);
//       // Check if the error response contains HTML (indicating a server error page)
//       if (error instanceof Error && error.message.includes('<!DOCTYPE')) {
//         throw new Error('Server error: The API returned an HTML page instead of JSON. Check your server configuration.');
//       }
//       // Re-throw the original error
//       throw error;
//     }
    
//     // Generate unique filename
//     const uniqueFilename = `${uuidv4()}_${file.name}`;
    
//     // Upload file to AWS S3
//     const s3Key = `resumes/${userId}/${uniqueFilename}`;
    
//     // Create put command for S3
//     const uploadParams = {
//       Bucket: bucketName,
//       Key: s3Key,
//       Body: new Uint8Array(fileBuffer),
//       ContentType: file.type,
//     };
    
//     // Upload to S3
//     await s3Client.send(new PutObjectCommand(uploadParams));
    
//     // Generate a signed URL (valid for 7 days)
//     const getObjectCommand = new GetObjectCommand({
//       Bucket: bucketName,
//       Key: s3Key
//     });
    
//     const filelink = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 604800 }); // 7 days
    
//     // Save to MongoDB through our API
//     const resumeData: Omit<ResumeData, "_id"> = {
//       filename: uniqueFilename,
//       filelink,
//       fileHash,
//       analysis: analysisJson,
//       vendor_id: vendorId || undefined,
//       vendor_name: vendorName || undefined,
//       user_id: userId  
//     };
    
//     try {
//       const savedData = await apiClient.resumes.saveResume(resumeData) as SavedResumeResponse;
//       return {
//         analysis: analysisJson,
//         savedData,
//       };
//     } catch (error) {
//       console.error("Error saving resume to database:", error);
//       // Check if the error response contains HTML
//       if (error instanceof Error && error.message.includes('<!DOCTYPE')) {
//         throw new Error('Server error: The API returned an HTML page instead of JSON. Check your server configuration.');
//       }
//       // Re-throw the original error
//       throw error;
//     }
//   } catch (error) {
//     console.error("Error analyzing resume:", error)
//     throw error
//   }
// }

