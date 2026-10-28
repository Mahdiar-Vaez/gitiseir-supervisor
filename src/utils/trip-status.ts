import { TripStatus } from '@/components/ui/StatusPill';

/**
 * Backend TripStatus Enum definition (از کد سی‌شارپ بک‌اند گیتی‌سیر):
 * Pending = 0    -> [Display(Name = "در انتظار تأیید")]
 * Confirmed = 1  -> [Display(Name = "تأیید شده")]
 * InProgress = 2 -> (در حال انجام - وضعیت عملیاتی/سابقه)
 * Completed = 3  -> (تکمیل شده - وضعیت عملیاتی/سابقه)
 * Cancelled = 4  -> [Display(Name = "لغو شده")]
 */
export enum BackendTripStatus {
  Pending = 0,
  Confirmed = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
}

export interface TripStatusConfig {
  status: TripStatus;
  label: string;
  backendName: string;
}

export function getTripStatusConfig(status: number): TripStatusConfig {
  switch (status) {
    case 0:
      return {
        status: 'warning',
        label: 'در انتظار تأیید',
        backendName: 'Pending',
      };
    case 1:
      return {
        status: 'info',
        label: 'تأیید شده',
        backendName: 'Confirmed',
      };
    case 2:
      return {
        status: 'warning',
        label: 'در حال انجام',
        backendName: 'InProgress',
      };
    case 3:
      return {
        status: 'success',
        label: 'تکمیل شده',
        backendName: 'Completed',
      };
    case 4:
      return {
        status: 'danger',
        label: 'لغو شده',
        backendName: 'Cancelled',
      };
    default:
      return {
        status: 'info',
        label: 'نامشخص',
        backendName: 'Unknown',
      };
  }
}
