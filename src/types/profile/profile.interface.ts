/* Application Package */
import { ISongMetadata } from "@/types/dashboard/song.interface";

/*
 * One row of `GET /analysis/history`. `viewedAt` is an ISO string on the wire
 * (the server's `Date` does not survive JSON) and means "last viewed": every
 * repeat view moves the song back to the top.
 */
export interface IHistoryItem extends ISongMetadata {
    viewedAt: string;
}

/* The `data` payload of `GET /analysis/history`. */
export interface IHistoryPage {
    items: IHistoryItem[];
    total: number;
    hasMore: boolean;
}
