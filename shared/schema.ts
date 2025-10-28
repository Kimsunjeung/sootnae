import { z } from "zod";

// Runner data schema
export const runnerSchema = z.object({
  bibNumber: z.string(),
  name: z.string(),
  category: z.string().optional(),
  checkpoints: z.array(z.object({
    name: z.string(),
    distance: z.string(),
    time: z.string().optional(),
    passed: z.boolean(),
  })),
  currentCheckpoint: z.string().optional(),
  currentPosition: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  totalDistance: z.string().optional(),
  elapsedTime: z.string().optional(),
  pace: z.string().optional(),
  estimatedFinish: z.string().optional(),
  progressPercentage: z.number().optional(),
});

export type Runner = z.infer<typeof runnerSchema>;

// Recent search schema (for localStorage)
export const recentSearchSchema = z.object({
  bibNumber: z.string(),
  timestamp: z.number(),
});

export type RecentSearch = z.infer<typeof recentSearchSchema>;
