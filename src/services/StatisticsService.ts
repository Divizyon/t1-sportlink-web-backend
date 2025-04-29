import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval, getDay, startOfMonth, endOfMonth } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import supabase, { supabaseAdmin } from '../config/supabase';
import { Database } from '../types/supabase';

// Assuming Supabase types are potentially outdated, using 'any' temporarily
type EventStatus = any; // Should be Database['public']['Tables']['events']['Row']['status'];

// Type for the desired daily object in the array
type DailyStatusObject = {
  date: string; // e.g., "2023-10-27"
  // Status keys will be added dynamically
  [status: string]: number | string; // Value is count (number) or date (string)
};

// Keeping MonthlyStats as is for now
type MonthlyStats = {
  year: number;
  month: number;
  totals: { [key: string]: number };
};

const timeZone = 'Europe/Istanbul';
// Define expected status keys based on the monthly example
const EXPECTED_STATUSES = ["pending", "completed", "active", "rejected"];

export const StatisticsService = {
  // Rewritten getWeeklyStats function to return flat array
  async getWeeklyStats(startDateStr: string, endDateStr: string): Promise<DailyStatusObject[]> {
    try {
      const startDate = startOfDay(parseISO(startDateStr));
      const endDate = endOfDay(parseISO(endDateStr));

      // Select end_date and status, filter by end_date
      const { data: events, error } = await supabaseAdmin
        .from('events')
        .select('end_date, status') // Select end_date instead of created_at
        .gte('end_date', startDate.toISOString()) // Filter by end_date
        .lte('end_date', endDate.toISOString());   // Filter by end_date
        // No ordering needed as we process all events

      if (error) {
        console.error('Supabase error fetching weekly stats:', error);
        throw new Error('Failed to fetch weekly statistics.');
      }

      // Initialize a map to hold counts per day per status
      const dailyDataMap: { [dateKey: string]: { [status: string]: number } } = {};
      const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });

      // Initialize map with all expected statuses set to 0 for each day in the interval
      intervalDays.forEach(date => {
        const zonedDate = toZonedTime(date, timeZone);
        const dayKey = format(zonedDate, 'yyyy-MM-dd');
        dailyDataMap[dayKey] = {};
        EXPECTED_STATUSES.forEach(status => {
          dailyDataMap[dayKey][status] = 0;
        });
      });

      // Process events and count statuses per day based on end_date
      if (events) {
        events.forEach((event: any) => {
          // Use end_date for grouping
          if (!event.end_date || !event.status) return; // Skip incomplete data (check end_date)

          try {
            // Parse end_date
            const utcEventEndDate = parseISO(event.end_date); 
            const zonedEventEndDate = toZonedTime(utcEventEndDate, timeZone);
            const dayKey = format(zonedEventEndDate, 'yyyy-MM-dd'); // Group key based on end_date
            const currentStatus = event.status;

            // Ensure the day exists in the map (it should due to initialization)
            if (dailyDataMap[dayKey]) {
              // Increment the count for the specific status
              // If status from DB is not in EXPECTED_STATUSES, it will be added dynamically
              dailyDataMap[dayKey][currentStatus] = (dailyDataMap[dayKey][currentStatus] || 0) + 1;
            } else {
              // This case might happen if an event ends exactly on the start/end boundary 
              // depending on timezones and exact timing, or if end_date is outside the interval.
              console.warn(`Event end date ${dayKey} (from ${event.end_date}) not in initialized map. Interval: ${startDateStr} to ${endDateStr}`);
            }
          } catch (parseError) {
            // Log error related to end_date parsing
            console.error(`Error processing event end date: ${event.end_date}`, parseError); 
          }
        });
      }

      // Convert the map into the desired array format
      const resultArray: DailyStatusObject[] = [];
      intervalDays.forEach(date => {
        const zonedDate = toZonedTime(date, timeZone);
        const dayKey = format(zonedDate, 'yyyy-MM-dd');
        
        // Create the object for the day, starting with the date
        const dailyObject: DailyStatusObject = { date: dayKey };

        // Add status counts to the object
        // Ensure all expected statuses are present, even if count is 0
        EXPECTED_STATUSES.forEach(status => {
            dailyObject[status] = dailyDataMap[dayKey]?.[status] ?? 0;
        });
        // Add any unexpected statuses found in the data (optional)
        // for (const status in dailyDataMap[dayKey]) {
        //     if (!EXPECTED_STATUSES.includes(status)) {
        //         dailyObject[status] = dailyDataMap[dayKey][status];
        //     }
        // }

        resultArray.push(dailyObject);
      });

      return resultArray;

    } catch (error) {
      console.error('Error calculating weekly stats:', error);
      throw new Error('Failed to calculate weekly statistics.');
    }
  },

  // getMonthlyStats remains the same for now
  async getMonthlyStats(year: number, month: number): Promise<MonthlyStats> {
    if (month < 1 || month > 12) {
      throw new Error('Geçersiz ay numarası. 1 ile 12 arasında olmalıdır.');
    }
    const dateForMonth = new Date(year, month - 1, 1);
    const startDate = startOfMonth(dateForMonth);
    const endDate = endOfMonth(dateForMonth);

    try {
      const { data: events, error } = await supabaseAdmin
        .from('events')
        .select('status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        console.error('Supabase error fetching monthly stats:', error);
        throw new Error('Failed to fetch monthly statistics.');
      }

      const monthlyTotals: { [key: string]: number } = {};

      if (events) {
        events.forEach((event: any) => {
          if (!event.status) return;
          const currentStatus = event.status;
          monthlyTotals[currentStatus] = (monthlyTotals[currentStatus] || 0) + 1;
        });
      }

      const result: MonthlyStats = {
        year: year,
        month: month,
        totals: monthlyTotals
      };

      return result;

    } catch (error) {
        if (error instanceof Error && error.message.includes('Invalid time value')) {
            console.error(`Invalid year/month combination: ${year}-${month}`);
            throw new Error(`Geçersiz yıl/ay kombinasyonu: ${year}-${month}`);
        }
      console.error('Error calculating monthly stats:', error);
      if (error instanceof Error) {
          throw error;
      } else {
        throw new Error('Failed to calculate monthly statistics.');
      }
    }
  }
}; 