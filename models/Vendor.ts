import mongoose, { Document, Schema } from 'mongoose';

export interface IVendor extends Document {
  name: string;
  address?: string;
  contact_person?: string;
  country?: string;
  email?: string;
  phone?: string;
  state?: string;
  status?: string;
  created_at: Date;
  updated_at: Date;
  metadata?: {
    created_by?: string;
    created_by_id?: string;
    last_modified_by?: string;
  };
}

const VendorSchema = new Schema<IVendor>(
  {
    name: { type: String, required: true },
    address: { type: String },
    contact_person: { type: String },
    country: { type: String },
    email: { type: String },
    phone: { type: String },
    state: { type: String },
    status: { type: String, default: 'active', enum: ['active', 'inactive'] },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    metadata: {
      created_by: { type: String },
      created_by_id: { type: String },
      last_modified_by: { type: String },
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export default mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema); 