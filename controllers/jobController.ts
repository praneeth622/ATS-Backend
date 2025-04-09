import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Job from '../models/Job';
import JobCandidate from '../models/JobCandidate';
import Resume from '../models/Resume';
import { authenticate, isAdmin, AuthenticatedRequest } from '../middlewares/authMiddleware';
import { canModifyResource, isAdminUser } from '../utils/auth-helpers';
import User from '../models/User';

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role?: string;
    [key: string]: any;
  };
}

// Get all jobs
export const getAllJobs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get query parameters
    const status = req.query.status as string;
    
    // Build query object
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Find all jobs
    const jobs = await Job.find(query).sort({ created_at: -1 });
    
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

// Get job by ID
export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const job = await Job.findById(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.status(200).json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
};

// Create a new job
export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const userEmail = req.user?.email;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Create new job with metadata
    const jobData = {
      ...req.body,
      metadata: {
        created_by: userEmail,
        created_by_id: userId,
        last_modified_by: userEmail,
      }
    };
    
    const job = new Job(jobData);
    await job.save();
    
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

// Update an existing job
export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const job = await Job.findById(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if user can modify this job
    const isAuthorized = isAdminUser(userRole) || canModifyResource(userId, job.metadata?.created_by_id);
    
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }
    
    // Update job data
    const updatedJobData = {
      ...req.body,
      'metadata.last_modified_by': userEmail,
    };
    
    const updatedJob = await Job.findByIdAndUpdate(id, updatedJobData, { new: true });
    
    res.status(200).json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
};

// Delete a job
export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const job = await Job.findById(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if user can delete this job
    const isAuthorized = isAdminUser(userRole) || canModifyResource(userId, job.metadata?.created_by_id);
    
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }
    
    // Delete job
    await Job.findByIdAndDelete(id);
    
    // Also delete any associated candidates
    await JobCandidate.deleteMany({ jobId: id });
    
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
};

// Get job candidates
export const getJobCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Find the job to ensure it exists
    const job = await Job.findById(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Find candidates from the JobCandidate collection
    const candidates = await JobCandidate.find({ jobId: id }).sort({ 'matchAnalysis.matchPercentage': -1 });
    
    res.status(200).json(candidates);
  } catch (error) {
    console.error('Error fetching job candidates:', error);
    res.status(500).json({ error: 'Failed to fetch job candidates' });
  }
};

// Save a list of analyzed candidate matches to the database
export const saveJobCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { candidates } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Find the job
    const job = await Job.findById(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if valid candidates array was provided
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ error: 'Invalid candidates data' });
    }

    console.log(`Saving ${candidates.length} candidates for job ${id}`);
    
    // First, find all existing candidates to preserve tracking data
    const existingCandidates = await JobCandidate.find({ 
      jobId: id, 
      filename: { $in: candidates.map(c => c.filename) } 
    });
    
    console.log(`Found ${existingCandidates.length} existing candidates with tracking data`);
    
    // Create a map of existing tracking data by filename
    const trackingDataMap = new Map();
    existingCandidates.forEach(candidate => {
      if (candidate.tracking) {
        trackingDataMap.set(candidate.filename, candidate.tracking);
      }
    });
    
    // Define a proper interface for the processed candidate to include the tracking property
    interface ProcessedCandidate {
      filename: string;
      name: string;
      email: string;
      matchAnalysis: {
        matchPercentage: number;
        matchingSkills: string[];
        missingRequirements: string[];
        experienceMatch: boolean;
        educationMatch: boolean;
        overallAssessment: string;
      };
      analysis: {
        key_skills: string[];
        education_details: any[];
        work_experience_details: any[];
      };
      jobId: mongoose.Types.ObjectId;
      userId: string;
      userEmail: string;
      tracking?: any; // Add tracking property as optional
    }

    // Process candidates one by one instead of bulk write to better handle errors
    const processedCandidates = [];
    const errors = [];
    
    for (const candidate of candidates) {
      try {
        // Skip candidates without required fields
        if (!candidate.filename || !candidate.matchAnalysis) {
          console.warn(`Skipping invalid candidate data: ${JSON.stringify(candidate)}`);
          continue;
        }
        
        // Ensure required fields exist
        const processedCandidate: ProcessedCandidate = {
          filename: candidate.filename,
          name: candidate.name || "Unknown",
          email: candidate.email || "unknown@example.com",
          matchAnalysis: {
            matchPercentage: candidate.matchAnalysis.matchPercentage || 0,
            matchingSkills: candidate.matchAnalysis.matchingSkills || [],
            missingRequirements: candidate.matchAnalysis.missingRequirements || [],
            experienceMatch: candidate.matchAnalysis.experienceMatch || false,
            educationMatch: candidate.matchAnalysis.educationMatch || false,
            overallAssessment: candidate.matchAnalysis.overallAssessment || ""
          },
          analysis: {
            key_skills: candidate.analysis?.key_skills || [],
            education_details: candidate.analysis?.education_details || [],
            work_experience_details: candidate.analysis?.work_experience_details || []
          },
          jobId: new mongoose.Types.ObjectId(id),
          userId: candidate.userId || userId,
          userEmail: candidate.userEmail || req.user?.email || "unknown@example.com"
        };
        
        // Add existing tracking data if it exists
        const existingTracking = trackingDataMap.get(candidate.filename);
        if (existingTracking) {
          processedCandidate.tracking = existingTracking;
        } else {
          processedCandidate.tracking = {
            status: 'pending',
            statusHistory: [{
              status: 'pending',
              timestamp: new Date(),
              updatedBy: req.user?.email || 'system'
            }],
            lastUpdated: new Date(),
            updatedBy: req.user?.email || 'system'
          };
        }
        
        // Try to find existing candidate
        const existingCandidate = await JobCandidate.findOne({
          jobId: id,
          filename: candidate.filename
        });
        
        if (existingCandidate) {
          // Update existing candidate
          await JobCandidate.updateOne(
            { _id: existingCandidate._id },
            { 
              $set: {
                ...processedCandidate,
                updated_at: new Date()
              }
            }
          );
        } else {
          // Create new candidate
          const newCandidate = new JobCandidate({
            ...processedCandidate,
            created_at: new Date(),
            updated_at: new Date()
          });
          
          await newCandidate.save();
        }
        
        processedCandidates.push(processedCandidate);
      } catch (err: unknown) {
        console.error(`Error processing candidate ${candidate.filename}:`, err);
        errors.push({
          filename: candidate.filename,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
    
    res.status(200).json({
      message: 'Candidates saved successfully',
      savedCount: processedCandidates.length,
      totalCount: candidates.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: unknown) {
    console.error('Error saving job candidates:', error);
    res.status(500).json({
      error: 'Failed to save job candidates',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// Update candidate status
export const updateCandidateStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, candidateId } = req.params;
    const { status, ...additionalData } = req.body;
    
    // Authenticate user
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find job and candidate
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Find the candidate by filename
    const candidate = await JobCandidate.findOne({ 
      jobId: id, 
      filename: candidateId 
    });

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Initialize tracking if it doesn't exist
    if (!candidate.tracking) {
      candidate.tracking = {
        status: 'new',
        statusHistory: [],
        lastUpdated: new Date(),
        updatedBy: req.user?.email || 'system'
      };
    }

    // Get previous status for history
    const previousStatus = candidate.tracking.status;

    // Update tracking info
    candidate.tracking.status = status;
    candidate.tracking.lastUpdated = new Date();
    candidate.tracking.updatedBy = req.user?.email || 'system';

    // Add status history entry
    if (!candidate.tracking.statusHistory) {
      candidate.tracking.statusHistory = [];
    }

    candidate.tracking.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user?.email || 'system'
    });

    // Process additional data
    if (status === 'rate_confirmed' && additionalData.rateConfirmed) {
      candidate.tracking.rateConfirmed = additionalData.rateConfirmed;
    }

    if (status === 'interview_scheduled' && additionalData.interviewDate) {
      candidate.tracking.interviewDate = additionalData.interviewDate;
    }

    if (status === 'contacted' && additionalData.contactedDate) {
      candidate.tracking.contactedDate = additionalData.contactedDate;
    }

    if (additionalData.notes) {
      candidate.tracking.notes = additionalData.notes;
    }

    // Save updated candidate
    await candidate.save();

    // Return the updated candidate with tracking info
    res.status(200).json({ 
      message: 'Candidate status updated successfully',
      candidate: candidate.toObject(),
      tracking: candidate.tracking
    });
  } catch (error) {
    console.error('Error updating candidate status:', error);
    res.status(500).json({ message: 'Error updating candidate status', error: (error as Error).message });
  }
};

// Get all resumes for job matching
export const getAllResumesForMatching = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // First try to get all resumes directly 
    try {
      const allResumes = await Resume.find({});
      
      if (allResumes && allResumes.length > 0) {
        console.log(`Found ${allResumes.length} total resumes`);
        
        // Transform the resumes to the expected format
        const transformedResumes = allResumes.map(resume => {
          const user_id = resume.user_id || userId;
          
          return {
            filename: resume.filename,
            analysis: resume.analysis || {
              name: "Unknown",
              email: "unknown@example.com",
              key_skills: [],
              education_details: [],
              work_experience_details: []
            },
            userId: user_id,
            userEmail: resume.user_email || "unknown@example.com"
          };
        });
        
        return res.status(200).json(transformedResumes);
      }
    } catch (directError) {
      console.warn('Error fetching resumes directly, falling back to user-by-user approach:', directError);
    }
    
    // Fall back to getting users first and then their resumes
    const users = await User.find();
    const allResumes = [];
    
    // Collect resumes from all users
    for (const user of users) {
      try {
        const userResumes = await Resume.find({ user_id: user.uid });
        
        // Transform the resumes to the expected format
        const transformedResumes = userResumes.map(resume => ({
          filename: resume.filename,
          analysis: resume.analysis || {
            name: "Unknown",
            email: "unknown@example.com",
            key_skills: [],
            education_details: [],
            work_experience_details: []
          },
          userId: user.uid,
          userEmail: user.email || "unknown@example.com"
        }));
        
        allResumes.push(...transformedResumes);
      } catch (error) {
        console.warn(`Error fetching resumes for user ${user.uid}:`, error);
      }
    }
    
    res.status(200).json(allResumes);
  } catch (error) {
    console.error('Error fetching all resumes:', error);
    res.status(500).json({ error: 'Failed to fetch all resumes' });
  }
};

// Assign recruiters to a job
export const assignRecruiters = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { recruiterIds } = req.body;
    const userId = req.user?.uid;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Find the job
    const job = await Job.findById(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if user is admin or the creator of the job
    const isAdmin = userRole === 'admin';
    const isCreator = job.metadata?.created_by_id === userId;
    
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Not authorized to assign recruiters to this job' });
    }
    
    // Update job with assigned recruiters
    const updatedJob = await Job.findByIdAndUpdate(
      id, 
      { assigned_recruiters: recruiterIds }, 
      { new: true }
    );
    
    res.status(200).json(updatedJob);
  } catch (error) {
    console.error('Error assigning recruiters:', error);
    res.status(500).json({ error: 'Failed to assign recruiters' });
  }
};

// Check for new resumes since last analysis
export const checkForNewResumes = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // Job ID
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Find the job to ensure it exists
    const job = await Job.findById(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Get all analyzed candidates for this job
    const analyzedCandidates = await JobCandidate.find({ jobId: id });
    const analyzedFilenames = analyzedCandidates.map(c => c.filename);
    
    // Get all available resumes
    const allResumes = await Resume.find({});
    const allFilenames = allResumes.map(r => r.filename);
    
    // Find filenames that are in allResumes but not in analyzedCandidates
    const newFilenames = allFilenames.filter(filename => !analyzedFilenames.includes(filename));
    
    res.status(200).json({ 
      hasNewResumes: newFilenames.length > 0,
      newResumeCount: newFilenames.length,
      analyzedCount: analyzedFilenames.length,
      totalResumeCount: allFilenames.length
    });
    
  } catch (error) {
    console.error('Error checking for new resumes:', error);
    res.status(500).json({ error: 'Failed to check for new resumes' });
  }
};