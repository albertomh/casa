import utils from "../utils";
import HeaderHtml from "./templates/header.html";
import AllQueueHtml from "./templates/queue_all.html";
import QueueItemHtml from "./templates/queue_item.html";
import ScriptsHtml from "./templates/scripts.html";
import EditTitleHtml from "./templates/title_edit.html";
import TitleItemHtml from "./templates/title_item.html";
import NewTitleHtml from "./templates/title_new.html";
import AllTitlesHtml from "./templates/titles_all.html";

export type JennflixTitle = {
    id: number;
    title: string;
    poster_path: string;
    imdb_url: string;
    media_type: string;
    location: string;
    tags: string;
};

export type JennflixQueue = {
    id: number;
    title_id: number;
    position: number;
};

export class JennflixRepository {
    constructor(private sql: SqlStorage) {}

    listTitles(): JennflixTitle[] {
        return this.sql
            .exec("SELECT * FROM jennflix__title ORDER BY title ASC")
            .toArray() as JennflixTitle[];
    }

    getTitle(id: number): JennflixTitle | null {
        return (
            (this.sql
                .exec("SELECT * FROM jennflix__title WHERE id = ?", id)
                .toArray()[0] as JennflixTitle) ?? null
        );
    }

    addTitle(
        title: string,
        posterPath: string,
        imdbUrl: string,
        mediaType: string,
        location: string,
        tags: string,
    ): number {
        this.sql.exec(
            "INSERT INTO jennflix__title (title, poster_path, imdb_url, media_type, location, tags) VALUES (?, ?, ?, ?, ?, ?)",
            title,
            posterPath,
            imdbUrl,
            mediaType,
            location,
            tags,
        );
        return this.sql.exec("SELECT last_insert_rowid() as id").one()
            .id as number;
    }

    updateTitle(
        id: number,
        title: string,
        posterPath: string,
        imdbUrl: string,
        mediaType: string,
        location: string,
        tags: string,
    ) {
        this.sql.exec(
            "UPDATE jennflix__title SET title = ?, poster_path = ?, imdb_url = ?, media_type = ?, location = ?, tags = ? WHERE id = ?",
            title,
            posterPath,
            imdbUrl,
            mediaType,
            location,
            tags,
            id,
        );
    }

    deleteTitle(id: number) {
        this.sql.exec("DELETE FROM jennflix__queue WHERE title_id = ?", id);
        this.sql.exec("DELETE FROM jennflix__title WHERE id = ?", id);
    }

    listQueue(): JennflixQueue[] {
        return this.sql
            .exec("SELECT * FROM jennflix__queue ORDER BY position ASC, id ASC")
            .toArray() as JennflixQueue[];
    }

    addToQueue(title_id: number): number {
        const existing = this.getQueueItemByTitleId(title_id);
        if (existing) {
            return existing.id;
        }
        const maxPos =
            (this.sql
                .exec(
                    "SELECT COALESCE(MAX(position), -1) as m FROM jennflix__queue",
                )
                .one().m as number) ?? -1;
        try {
            this.sql.exec(
                "INSERT INTO jennflix__queue (title_id, position) VALUES (?, ?)",
                title_id,
                maxPos + 1,
            );
        } catch {
            const queued = this.getQueueItemByTitleId(title_id);
            if (queued) return queued.id;
            throw new Error("Unable to add title to queue");
        }
        return this.sql.exec("SELECT last_insert_rowid() as id").one()
            .id as number;
    }

    getQueueItemByTitleId(title_id: number): JennflixQueue | null {
        return (
            (this.sql
                .exec(
                    "SELECT * FROM jennflix__queue WHERE title_id = ?",
                    title_id,
                )
                .toArray()[0] as JennflixQueue) ?? null
        );
    }

    markWatched(queue_id: number) {
        const row = this.sql
            .exec("SELECT title_id FROM jennflix__queue WHERE id = ?", queue_id)
            .toArray()[0] as { title_id: number } | undefined;
        if (row) {
            this.sql.exec(
                "INSERT INTO jennflix__watched (title_id) VALUES (?)",
                row.title_id,
            );
        }
        this.sql.exec("DELETE FROM jennflix__queue WHERE id = ?", queue_id);
        this.reindexQueue();
    }

    moveQueueItem(id: number, direction: "up" | "down") {
        const queue = this.listQueue();
        const idx = queue.findIndex((q) => q.id === id);
        if (idx === -1) return;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= queue.length) return;

        const a = queue[idx];
        const b = queue[swapIdx];
        // Swap positions
        this.sql.exec(
            "UPDATE jennflix__queue SET position = ? WHERE id = ?",
            b.position,
            a.id,
        );
        this.sql.exec(
            "UPDATE jennflix__queue SET position = ? WHERE id = ?",
            a.position,
            b.id,
        );
    }

    private reindexQueue() {
        const queue = this.sql
            .exec(
                "SELECT id FROM jennflix__queue ORDER BY position ASC, id ASC",
            )
            .toArray() as { id: number }[];
        queue.forEach((q, i) => {
            this.sql.exec(
                "UPDATE jennflix__queue SET position = ? WHERE id = ?",
                i,
                q.id,
            );
        });
    }

    getTitleById(id: number): JennflixTitle | null {
        return (
            (this.sql
                .exec("SELECT * FROM jennflix__title WHERE id = ?", id)
                .toArray()[0] as JennflixTitle) ?? null
        );
    }
}

export class JennflixRenderer {
    scripts(): string {
        return ScriptsHtml;
    }

    applet(content: string): string {
        return `<section id="jennflix-applet" hx-boost="true" hx-target="#applet">${content}</section>`;
    }

    header(urlPathname = ""): string {
        const isTitleAction =
            urlPathname.includes("/jennflix/titles/new") ||
            (urlPathname.startsWith("/jennflix/titles/") &&
                urlPathname.endsWith("/edit"));
        return HeaderHtml.replace(
            "{{ add_btn_class }}",
            isTitleAction ? "invisible" : "",
        );
    }

    newTitleForm(): string {
        return NewTitleHtml;
    }

    editTitleForm(title: JennflixTitle): string {
        const values: Record<string, string> = {
            "{{ id }}": utils.escape(title.id),
            "{{ title }}": utils.escape(title.title),
            "{{ poster_path }}": utils.escape(title.poster_path ?? ""),
            "{{ imdb_url }}": utils.escape(title.imdb_url),
            "{{ film_checked }}": title.media_type !== "tv" ? "checked" : "",
            "{{ tv_checked }}": title.media_type === "tv" ? "checked" : "",
            "{{ dvd_checked }}": title.location === "DVD" ? "checked" : "",
            "{{ hdd_checked }}": title.location === "HDD" ? "checked" : "",
            "{{ tags }}": utils.escape(title.tags ?? ""),
        };
        return EditTitleHtml.replace(
            /\{\{ [\w]+ \}\}/g,
            (match: string) => values[match] ?? match,
        );
    }

    titleItem(title: JennflixTitle, isQueued: boolean): string {
        const values: Record<string, string> = {
            "{{ id }}": utils.escape(title.id),
            "{{ title }}": utils.escape(title.title),
            "{{ poster_path }}": title.poster_path
                ? `${utils.escape(title.poster_path)}`
                : "",
            "{{ imdb_url }}": utils.escape(title.imdb_url),
            "{{ media_type }}": utils.escape(title.media_type ?? "film"),
            "{{ location }}": utils.escape(title.location ?? ""),
            "{{ location_badge_class }}": title.location ? "" : "hidden",
            "{{ tags }}": utils.escape(title.tags ?? ""),
            "{{ my_list_disabled }}": isQueued ? "disabled" : "",
            "{{ my_list_btn_class }}": isQueued
                ? "border-green-700 text-green-700"
                : "border-green-700 bg-green-700 text-white",
            "{{ my_list_icon }}": isQueued
                ? '<i class="bi bi-check2"></i>'
                : '<i class="bi bi-plus-lg"></i>',
            "{{ my_list_label }}": isQueued ? "In My List" : "My List",
        };
        return TitleItemHtml.replace(
            /\{\{ [\w]+ \}\}/g,
            (match: string) => values[match] ?? match,
        );
    }

    queueItem(
        title: JennflixTitle,
        queueId: number,
        isFirst: boolean,
        isLast: boolean,
    ): string {
        const values: Record<string, string> = {
            "{{ title }}": utils.escape(title.title),
            "{{ queue_id }}": utils.escape(queueId),
            "{{ up_disabled }}": isFirst ? "disabled" : "",
            "{{ down_disabled }}": isLast ? "disabled" : "",
        };
        return QueueItemHtml.replace(
            /\{\{ [\w]+ \}\}/g,
            (match: string) => values[match] ?? match,
        );
    }

    queue(titles: JennflixTitle[], queue: JennflixQueue[]): string {
        const queueHtml = queue
            .map((q, i) => {
                const t = titles.find((t) => t.id === q.title_id);
                return t
                    ? this.queueItem(t, q.id, i === 0, i === queue.length - 1)
                    : "";
            })
            .join("");
        if (queueHtml.trim() === "") {
            return AllQueueHtml.replace(
                "{{ queue }}",
                "<p class='text-sm text-black/60 pt-1'>Your list is empty.</p>",
            );
        }
        return AllQueueHtml.replace("{{ queue }}", queueHtml);
    }

    titles(titles: JennflixTitle[], queuedTitleIds: Set<number>): string {
        const titlesHtml = titles
            .map((t) => this.titleItem(t, queuedTitleIds.has(t.id)))
            .join("");
        return AllTitlesHtml.replace("{{ titles }}", titlesHtml);
    }
}
