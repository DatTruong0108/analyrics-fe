/* Application Package */
import { ISongMetadata } from "@/types/dashboard/song.interface";

/*
 * One row of `GET /favorites`. `favoritedAt` is an ISO string on the wire and
 * means "first favourited": re-adding a favourite does not move it.
 */
export interface IFavoriteItem extends ISongMetadata {
    favoritedAt: string;
}

/* The `data` payload of `GET /favorites`. */
export interface IFavoritesPage {
    items: IFavoriteItem[];
    total: number;
    hasMore: boolean;
}
