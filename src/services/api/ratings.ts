import { ApiResponse } from './types';

export interface SurveyTag {
  id: string;
  label: string;
  count: number;
  percentage: number;
}

export interface DriverRatingStats {
  overallRating: number;
  totalReviews: number;
  tripsThisWeek: number;
  tripsToday: number;
  satisfactionRate: number;
  topPositives: SurveyTag[];
  topImprovements: SurveyTag[];
}

export const SAMPLE_DRIVER_RATINGS: DriverRatingStats = {
  overallRating: 4.85,
  totalReviews: 342,
  tripsThisWeek: 24,
  tripsToday: 4,
  satisfactionRate: 97,
  topPositives: [
    { id: '1', label: 'بوی مطبوع و تمیزی کابین', count: 48, percentage: 88 },
    { id: '2', label: 'رانندگی ایمن و آرام', count: 39, percentage: 76 },
    { id: '3', label: 'برخورد حرفه‌ای و محترمانه', count: 27, percentage: 65 },
  ],
  topImprovements: [
    { id: '4', label: 'تاخیر جزئی در حرکت از مبدا', count: 4, percentage: 8 },
    { id: '5', label: 'تنظیم دمای کولر یا بخاری', count: 2, percentage: 4 },
  ],
};

/**
 * Fetch driver rating & passenger survey statistics
 */
export async function getDriverRatingsApi(
  _token?: string | null
): Promise<ApiResponse<DriverRatingStats>> {
  // In production, will connect to GET /api/driversMobile/ratings or /survey-stats
  return {
    statusCode: 200,
    success: true,
    message: null,
    result: SAMPLE_DRIVER_RATINGS,
  };
}
