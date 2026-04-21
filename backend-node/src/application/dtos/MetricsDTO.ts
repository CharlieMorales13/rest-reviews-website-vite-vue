import { z } from "zod";

export const TimeSeriesQuerySchema = z.object({
  days: z
    .preprocess((val) => Number(val ?? 30), z.number().min(1).max(365))
    .default(30),
});

export type TimeSeriesQuery = z.infer<typeof TimeSeriesQuerySchema>;

export interface TimeSeriesDataPoint {
  date: string;
  ige: number;
  avgFood: number;
  avgService: number;
  avgPrice: number;
  totalReviews: number;
}

export interface HistoricalMetricsResponse {
  establishmentId: string;
  name: string;
  series: TimeSeriesDataPoint[];
}
