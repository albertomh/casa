import utils from "../utils";
import AllHtml from "./templates/all.html";
import HeaderHtml from "./templates/header.html";
import QueueItemHtml from "./templates/queue_item.html";
import ScriptsHtml from "./templates/scripts.html";
import TitleItemHtml from "./templates/title_item.html";

export type JennflixTitle = {
    id: number;
    title: string;
    imdb_url: string;
    tags: string;
};

export type JennflixQueue = {
    id: number;
    title_id: number;
};

export class JennflixRepository {
    constructor(private sql: SqlStorage) {}

    listTitles(): JennflixTitle[] {
        return this.sql
            .exec("SELECT * FROM jennflix__title")
            .toArray() as JennflixTitle[];
    }

    addTitle(title: string, imdb_url: string, tags: string): number {
        this.sql.exec(
            "INSERT INTO jennflix__title (title, imdb_url, tags) VALUES (?, ?, ?)",
            title,
            imdb_url,
            tags,
        );
        return this.sql.exec("SELECT last_insert_rowid() as id").one()
            .id as number;
    }

    listQueue(): JennflixQueue[] {
        return this.sql
            .exec("SELECT * FROM jennflix__queue")
            .toArray() as JennflixQueue[];
    }

    addToQueue(title_id: number): number {
        this.sql.exec(
            "INSERT INTO jennflix__queue (title_id) VALUES (?)",
            title_id,
        );
        return this.sql.exec("SELECT last_insert_rowid() as id").one()
            .id as number;
    }

    removeFromQueue(id: number) {
        this.sql.exec("DELETE FROM jennflix__queue WHERE id = ?", id);
    }

    getTitleById(id: number): JennflixTitle | null {
        return this.sql
            .exec("SELECT * FROM jennflix__title WHERE id = ?", id)
            .one() as JennflixTitle | null;
    }
}

export class JennflixRenderer {
    scripts(): string {
        return ScriptsHtml;
    }

    header(): string {
        return HeaderHtml;
    }

    titleItem(title: JennflixTitle): string {
        const values: Record<string, string> = {
            "{{ id }}": utils.escape(title.id),
            "{{ title }}": utils.escape(title.title),
            "{{ imdb_url }}": utils.escape(title.imdb_url),
            "{{ tags }}": utils.escape(title.tags ?? ""),
        };
        return TitleItemHtml.replace(
            /\{\{ [\w]+ \}\}/g,
            (match: string) => values[match] ?? match,
        );
    }

    queueItem(title: JennflixTitle, queueId: number): string {
        const values: Record<string, string> = {
            "{{ title }}": utils.escape(title.title),
            "{{ queue_id }}": utils.escape(queueId),
        };
        return QueueItemHtml.replace(
            /\{\{ [\w]+ \}\}/g,
            (match: string) => values[match] ?? match,
        );
    }

    all(titles: JennflixTitle[], queue: JennflixQueue[]): string {
        const titlesHtml = titles.map((t) => this.titleItem(t)).join("");
        const queueHtml = queue
            .map((q) => {
                const t = titles.find((t) => t.id === q.title_id);
                return t ? this.queueItem(t, q.id) : "";
            })
            .join("");
        return AllHtml.replace("{{ scripts }}", this.scripts())
            .replace("{{ header }}", this.header())
            .replace("{{ titles }}", titlesHtml)
            .replace("{{ queue }}", queueHtml);
    }
}
