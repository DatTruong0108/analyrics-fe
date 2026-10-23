/* System Package */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

/* Application Package */
import SongContainer from "@/components/song/songContainer";
import { getSongAnalysis } from "@/lib/song-api";

interface SongPageProps {
    params: Promise<{ id: string }>;
}

/* Search engines cut descriptions around here; Facebook and Zalo show less. */
const MAX_DESCRIPTION_LENGTH = 160;

/* Cuts at a word boundary so a preview never ends mid-word. */
function toDescription(text: string): string {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (normalized.length <= MAX_DESCRIPTION_LENGTH) return normalized;

    const cut = normalized.slice(0, MAX_DESCRIPTION_LENGTH - 1);
    const lastSpace = cut.lastIndexOf(" ");

    return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`;
}

/*
 * Rendered on the server so link previews (Facebook, Zalo — their crawlers run
 * no JavaScript) and search engines get the title, cover and summary in the
 * HTML itself.
 */
export async function generateMetadata({ params }: SongPageProps): Promise<Metadata> {
    const { id } = await params;
    const data = await getSongAnalysis(id);

    if (!data) {
        return { title: "Không tìm thấy bài hát - Analyrics" };
    }

    const { song } = data;
    const title = `${song.title} - ${song.artist} | Phân tích lời bài hát`;
    const description = toDescription(data.overview);
    const path = `/song/${encodeURIComponent(song.id)}`;

    return {
        title: `${title} - Analyrics`,
        description,
        alternates: { canonical: path },
        openGraph: {
            type: "article",
            url: path,
            siteName: "Analyrics",
            locale: "vi_VN",
            title,
            description,
            images: [{ url: song.imageUrl, alt: `${song.title} - ${song.artist}` }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [song.imageUrl],
        },
    };
}

export default async function SongPage({ params }: SongPageProps) {
    const { id } = await params;
    const data = await getSongAnalysis(id);

    if (!data) notFound();

    /* Keyed by song: moving between two song pages must not carry one song's state into the other. */
    return <SongContainer key={data.song.id} data={data} />;
}
