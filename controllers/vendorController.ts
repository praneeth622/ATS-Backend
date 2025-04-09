import { Request, Response } from 'express';
import Vendor from '../models/Vendor';

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role?: string;
    [key: string]: any;
  };
}

// Get all vendors
export const getAllVendors = async (req: AuthRequest, res: Response) => {
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
    
    // Find all vendors
    const vendors = await Vendor.find(query).sort({ created_at: -1 });
    
    res.status(200).json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
};

// Get vendor by ID
export const getVendorById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    res.status(200).json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
};

// Create a new vendor
export const createVendor = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const userEmail = req.user?.email;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Add metadata to vendor data
    const vendorData = {
      ...req.body,
      metadata: {
        created_by: userEmail,
        created_by_id: userId,
        last_modified_by: userEmail,
      }
    };
    
    const vendor = new Vendor(vendorData);
    await vendor.save();
    
    res.status(201).json(vendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
};

// Update an existing vendor
export const updateVendor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    const userEmail = req.user?.email;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    // Update vendor data with last modifier info
    const updatedVendorData = {
      ...req.body,
      'metadata.last_modified_by': userEmail,
    };
    
    const updatedVendor = await Vendor.findByIdAndUpdate(id, updatedVendorData, { new: true });
    
    res.status(200).json(updatedVendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
};

// Delete a vendor
export const deleteVendor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    // Delete vendor
    await Vendor.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
}; 