import { createClient } from '@supabase/supabase-js';
// Config import removed as it's not used for Supabase credentials
import { Database } from '../types/supabase'; // Import generated Supabase types
// AppError import removed, will use generic Error or specific custom error if needed
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval, isBefore, isSameDay, isAfter } from 'date-fns'; // Added date-fns imports
import { toZonedTime } from 'date-fns-tz'; // Added date-fns-tz import

// Initialize Supabase client using process.env
// Read SUPABASE_URL and SUPABASE_SERVICE_KEY
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    // Update error message for SUPABASE_SERVICE_KEY
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be provided in environment variables.');
}

// Use supabaseServiceKey in the client creation
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Define the expected response structure for weekly stats
interface DailyStat {
    date: string; // YYYY-MM-DD format
    events: number;
    participants: number;
}
interface WeeklyStatsResponse {
    summary: {
        total_events: number;
        total_participants: number;
    };
    daily: DailyStat[];
}

// Define the structure expected from the RPC function
interface RpcWeeklyStat {
    stat_date: string; // Comes as string from RPC
    event_count: number;
    participant_count: number;
}

// Type for the desired daily object in the array (from previous attempt)
type DailyStatusObject = {
  date: string; // e.g., "2023-10-27"
  [status: string]: number | string; 
};

// Assumed structure for the RPC response row
interface RpcWeeklyStatusStat {
    stat_date: string; // Comes as string from RPC, e.g., "2023-10-23" or with time
    status_counts: { [status: string]: number }; // Object with counts per status
}

const timeZone = 'Europe/Istanbul'; // Define timezone
const EXPECTED_STATUSES = ["pending", "active", "completed", "rejected"]; // Define expected statuses in desired order

// Helper function to safely parse dates, returning null if invalid
const safeParseISO = (dateString: string | null | undefined): Date | null => {
    if (!dateString) return null;
    try {
        const date = parseISO(dateString);
        return isNaN(date.getTime()) ? null : date;
    } catch (e) {
        return null;
    }
};

class StatsService {
    /**
     * Fetches weekly statistics, determining the status of each event for each day 
     * based on its lifecycle timestamps (created_at, approved_at, rejected_at, start_time, end_time).
     * Formats the result into a flat array.
     */
    static async fetchWeeklyStats(): Promise<DailyStatusObject[]> {
        console.log('Fetching weekly stats with daily lifecycle status...');

        const today = endOfDay(new Date()); // Use end of today for the interval
        const sevenDaysAgo = startOfDay(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)); // Start of 7 days ago (inclusive)

        const endDateString = today.toISOString();
        const startDateString = sevenDaysAgo.toISOString();

        // Query events that could have been relevant during the week
        // Fetch events created before the end of the week AND potentially active/ended during the week
        const { data: events, error } = await supabase
            .from('Events')
            .select('id, created_at, status, start_time, end_time, approved_at, rejected_at') 
            .lte('created_at', endDateString) // Created before or on the end date
            // Filter out events that definitely ended before the week started OR were rejected before the week started
            .or(`end_time.gte.${startDateString},end_time.is.null`) // Ended during or after the week OR hasn't ended
            .or(`rejected_at.gte.${startDateString},rejected_at.is.null`) // Rejected during or after the week OR wasn't rejected
           // .eq('status', 'active') // Example: Maybe only fetch non-final statuses? Might need adjustment.

        if (error) {
            console.error('Supabase query error (fetchWeeklyStats - lifecycle):', error);
            throw new Error('Failed to fetch weekly status statistics from database.');
        }

        if (!events) {
             console.warn('No relevant events data returned for the weekly period.');
             return []; 
        }

        // Initialize map to hold status counts per day
        const dailyResultsMap: { [dateKey: string]: DailyStatusObject } = {};
        const intervalDays = eachDayOfInterval({ start: sevenDaysAgo, end: today });

        // Initialize map for all days in the interval
        intervalDays.forEach(date => {
            const zonedDay = toZonedTime(date, timeZone);
            const dayKey = format(zonedDay, 'yyyy-MM-dd');
            dailyResultsMap[dayKey] = { date: dayKey };
            EXPECTED_STATUSES.forEach(status => {
                dailyResultsMap[dayKey][status] = 0; 
            });
        });

        // Process each relevant event to determine its status for each day of the week
        events.forEach((event: any) => {
            // Safely parse all relevant dates for the event
            const createdAt = safeParseISO(event.created_at);
            const approvedAt = safeParseISO(event.approved_at);
            const rejectedAt = safeParseISO(event.rejected_at);
           // const startTime = safeParseISO(event.start_time); // Not strictly needed for status logic, but could be useful
            const endTime = safeParseISO(event.end_time);     

            if (!createdAt) { 
                console.warn(`Invalid created_at for event ${event.id}`);
                return; 
            }

            intervalDays.forEach(day => {
                const targetDayStart = startOfDay(day);
                const targetDayEnd = endOfDay(day);
                const dayKey = format(toZonedTime(targetDayStart, timeZone), 'yyyy-MM-dd');
                
                // Determine the status of the event *on* targetDay using the corrected logic order
                let statusForTheDay: string | null = null;

                // 1. Ignore if event was created AFTER the target day ended
                if (isAfter(createdAt, targetDayEnd)) {
                    statusForTheDay = null;
                } 
                // 2. Check if rejected on or before the end of the target day
                else if (rejectedAt && !isAfter(rejectedAt, targetDayEnd)) { // rejectedAt <= targetDayEnd
                    statusForTheDay = 'rejected';
                } 
                // 3. Check if ended before the target day started (Completed for the whole day)
                else if (endTime && isBefore(endTime, targetDayStart)) {
                    // Assumes ended events are considered completed unless explicitly rejected earlier.
                    statusForTheDay = 'completed';
                }
                // 4. Check if pending (created but not approved by end of day)
                else if (!approvedAt || isAfter(approvedAt, targetDayEnd)) {
                    statusForTheDay = 'pending';
                }
                // 5. Otherwise, it must be active (created, approved before/during day, not rejected, not ended before day)
                else {
                    statusForTheDay = 'active';
                }

                // Increment the count for the determined status if valid
                if (statusForTheDay && dailyResultsMap[dayKey]) {
                    if (dailyResultsMap[dayKey][statusForTheDay] !== undefined) {
                        dailyResultsMap[dayKey][statusForTheDay] = (dailyResultsMap[dayKey][statusForTheDay] as number) + 1;
                    } else {
                         console.warn(`Unexpected status '${statusForTheDay}' determined for event ${event.id} on ${dayKey}. Adding dynamically.`);
                         dailyResultsMap[dayKey][statusForTheDay] = 1;
                    }
                }
            });
        });

        // Convert the map values to an array
        const finalResultArray = Object.values(dailyResultsMap);

        return finalResultArray;
    }

    // Placeholder for fetchCategoryDistribution
    /**
     * Fetches participant distribution by sport category.
     * Counts unique participants per sport based on event participation.
     */
    static async fetchCategoryDistribution(): Promise<{ name: string; count: number }[]> {
        console.log('Fetching category distribution from Supabase...');

        const { data, error } = await supabase
            .from('Sports') // Start from Sports table
            .select(`
                name,
                Events!Events_sport_id_fkey!inner(
                    Event_Participants!inner(user_id)
                )
            `);
            // Explicitly specified the relationship Events_sport_id_fkey
            // Now Supabase knows which foreign key to use for the join.

        if (error) {
            console.error('Supabase query error (fetchCategoryDistribution):', error);
            throw new Error('Failed to fetch category distribution from database.');
        }

        if (!data) {
            return []; // Return empty array if no data
        }

        // Process the nested data to count unique participants per sport
        const categoryCounts: { [key: string]: Set<string> } = {};

        data.forEach(sport => {
            if (!categoryCounts[sport.name]) {
                categoryCounts[sport.name] = new Set<string>();
            }
            // Ensure Events and Event_Participants are arrays (adjust based on actual Supabase response structure)
            const events = Array.isArray(sport.Events) ? sport.Events : [];
            events.forEach(event => {
                const participants = Array.isArray(event.Event_Participants) ? event.Event_Participants : [];
                participants.forEach((participant: { user_id: string | null }) => {
                    if (participant.user_id) { // Check if user_id is not null
                       categoryCounts[sport.name].add(participant.user_id);
                    }
                });
            });
        });

        // Format the result into the desired structure
        const result = Object.entries(categoryCounts).map(([name, userSet]) => ({
            name: name,
            count: userSet.size // Count of unique user IDs
        }));

        return result;
    }

    // Placeholder for fetchMonthlyStats
    // Activate and implement fetchMonthlyStats
    /**
     * Fetches monthly event counts grouped by status.
     */
    static async fetchMonthlyStats(): Promise<{ month: string; onaylanan: number; bekleyen: number; iptal_edilen: number; tamamlanan: number }[]> {
        console.log('Fetching monthly stats from Supabase using RPC...');

        // Call the Supabase RPC function
        const { data, error } = await supabase.rpc('get_monthly_event_stats');

        if (error) {
            console.error('Supabase RPC error (get_monthly_event_stats):', error);
            throw new Error('Failed to fetch monthly statistics from database.');
        }

        if (!data) {
            return []; // Return empty array if no data
        }

        // Process the data from RPC
        // The RPC returns [{ event_month: 'YYYY-MM', status_counts: { status1: count1, status2: count2 } }]
        const result = data.map(row => {
            // Assert the type of status_counts to ensure it's an indexable object
            const statusCounts = (row.status_counts || {}) as Record<string, number>; // Type assertion added
            // Map database status values (uppercase) to frontend keys, defaulting to 0
            return {
                month: row.event_month,
                onaylanan: statusCounts['ACTIVE'] || 0,    // Map to ACTIVE
                bekleyen: statusCounts['PENDING'] || 0,    // Map to PENDING
                iptal_edilen: statusCounts['CANCELLED'] || 0, // Map to CANCELLED (adjust if it's REJECTED)
                tamamlanan: statusCounts['COMPLETED'] || 0, // Map to COMPLETED
            };
        });

        return result;
    }

    // Placeholder for fetchUserCategoryGrowth
    // Activate and implement fetchUserCategoryGrowth
    /**
     * Fetches user count and growth (last 30 days) by sport category.
     */
    static async fetchUserCategoryGrowth(): Promise<{ categories: { name: string; users: number; change: number }[]; period: number }> {
        console.log('Fetching user category growth from Supabase using RPC...');

        const periodDays = 30;

        // Call the Supabase RPC function
        const { data, error } = await supabase.rpc('get_user_growth_by_category', {
            period_days: periodDays
        });

        if (error) {
            console.error('Supabase RPC error (get_user_growth_by_category):', error);
            throw new Error('Failed to fetch user category growth from database.');
        }

        if (!data) {
            // Return default structure if no data
            return { categories: [], period: periodDays };
        }

        // Process the data from RPC
        // RPC returns [{ category_name: string, total_users: bigint, change: bigint }]
        const categories = data.map(row => ({
            name: row.category_name,
            users: Number(row.total_users), // Convert bigint to number
            change: Number(row.change)      // Convert bigint to number
        }));

        // Construct the final response object
        const result = {
            categories: categories,
            period: periodDays
        };

        return result;
    }
}

export default StatsService; 