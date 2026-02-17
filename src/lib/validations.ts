import { z } from 'zod';

// Auth schemas
export const SignUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required'),
});

export const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password is required'),
});

// Circle schemas
export const CreateCircleSchema = z.object({
  name: z.string().min(1, 'Circle name is required').max(100),
  description: z.string().max(500).optional(),
});

export const JoinCircleSchema = z.object({
  inviteCode: z.string().length(8, 'Invalid invite code format'),
});

// Event schemas
export const CreateEventSchema = z.object({
  title: z.string().min(1, 'Event title is required').max(100),
  description: z.string().max(500).optional(),
  locationName: z.string().min(1, 'Location is required'),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  startTime: z.string().refine((date) => new Date(date) > new Date(), {
    message: 'Event must be in the future',
  }),
  endTime: z.string().optional(),
});

// Ride schemas
export const CreateRideSchema = z.object({
  originText: z.string().min(1, 'Pickup location is required'),
  originLat: z.number().optional(),
  originLng: z.number().optional(),
  totalSeats: z.number().min(1, 'Must have at least 1 seat').max(8, 'Maximum 8 seats'),
});

export const JoinRideSchema = z.object({
  pickupLocation: z.string().optional(),
});

// Profile schemas
export const UpdateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  avatarUrl: z.string().url().optional().nullable(),
  homeLocation: z.string().max(200).optional().nullable(),
});

// Type exports
export type SignUpFormData = z.infer<typeof SignUpSchema>;
export type SignInFormData = z.infer<typeof SignInSchema>;
export type CreateCircleFormData = z.infer<typeof CreateCircleSchema>;
export type JoinCircleFormData = z.infer<typeof JoinCircleSchema>;
export type CreateEventFormData = z.infer<typeof CreateEventSchema>;
export type CreateRideFormData = z.infer<typeof CreateRideSchema>;
export type JoinRideFormData = z.infer<typeof JoinRideSchema>;
export type UpdateProfileFormData = z.infer<typeof UpdateProfileSchema>;
