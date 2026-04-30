import HeaderHtml from "./templates/header.html";
import ScriptsHtml from "./templates/scripts.html";
import TrayHtml from "./templates/tray.html";
import TrayItemHtml from "./templates/tray_item.html";
import AllTraysHtml from "./templates/trays_all.html";

export type Freezer = {
    id: number;
    label: string;
};

type FreezerTray = {
    id: number;
    freezer_id: number;
    label: string;
};

type FreezerItem = {
    id: number;
    tray_id: number;
    tray_label: string;
    name: string;
    quantity: number;
    added_at: string; // ISO 8601 UTC, e.g. "2024-01-15 13:45:00",
};

export class FreezerRepository {
    constructor(private sql: SqlStorage) {}

    listFreezers(): Freezer[] {
        return this.sql.exec("SELECT * FROM freezers").toArray() as Freezer[];
    }

    getFirstFreezer(): Freezer | null {
        const rows = this.listFreezers();
        return rows.length > 0 ? rows[0] : null;
    }

    getFreezerIdByTray(tray_id: number): number | null {
        const row = this.sql
            .exec(`SELECT freezer_id FROM freezer__trays WHERE id = ?`, tray_id)
            .one() as { freezer_id: number } | null;

        return row?.freezer_id ?? null;
    }

    createFreezer(label: string): number {
        this.sql.exec("INSERT INTO freezers (label) VALUES (?)", [label]);
        return this.sql.exec("SELECT last_insert_rowid() as id").one()
            .id as number;
    }

    createTraySet(freezer_id: number, count: number) {
        for (let i = 0; i < count; i++) {
            this.addTray(freezer_id, `Tray ${i + 1}`);
        }
    }

    listTrays(freezer_id: number) {
        return this.sql
            .exec(
                "SELECT * FROM freezer__trays WHERE freezer_id = ?",
                freezer_id,
            )
            .toArray() as FreezerTray[];
    }

    addTray(freezer_id: number, label: string) {
        this.sql.exec(
            "INSERT INTO freezer__trays (freezer_id, label) VALUES (?, ?)",
            freezer_id,
            label,
        );
    }

    listItemsByFreezer(freezer_id: number) {
        return this.sql
            .exec(
                `SELECT freezer__items.*, freezer__trays.label AS tray_label
                FROM freezer__items
                JOIN freezer__trays ON freezer__items.tray_id = freezer__trays.id
                WHERE freezer__trays.freezer_id = ?
                ORDER BY freezer__items.added_at ASC`,
                freezer_id,
            )
            .toArray() as FreezerItem[];
    }

    addItem(tray_id: number, name: string, quantity = 1) {
        this.sql.exec(
            "INSERT INTO freezer__items (tray_id, name, quantity) VALUES (?, ?, ?)",
            tray_id,
            name,
            quantity,
        );
    }

    incrementItemCount(itemId: number): FreezerItem | null {
        const row = this.sql
            .exec(`SELECT * FROM freezer__items WHERE id = ?`, itemId)
            .one() as FreezerItem | null;
        if (!row) return null;

        this.sql.exec(
            `UPDATE freezer__items SET quantity = quantity + 1 WHERE id = ?`,
            itemId,
        );
        return this.sql
            .exec(
                `SELECT freezer__items.*, freezer__trays.label AS tray_label FROM freezer__items JOIN freezer__trays ON freezer__items.tray_id = freezer__trays.id WHERE freezer__items.id = ?`,
                itemId,
            )
            .one() as FreezerItem;
    }

    decrementItemCount(itemId: number): FreezerItem | null {
        const row = this.sql
            .exec(
                `SELECT * FROM freezer__items JOIN freezer__trays ON freezer__items.tray_id = freezer__trays.id WHERE freezer__items.id = ?`,
                itemId,
            )
            .one() as FreezerItem | null;
        if (!row) return null;

        if (row.quantity <= 1) {
            this.sql.exec(`DELETE FROM freezer__items WHERE id = ?`, itemId);
            return null;
        }

        this.sql.exec(
            `UPDATE freezer__items SET quantity = quantity - 1 WHERE id = ?`,
            itemId,
        );
        return this.sql
            .exec(
                `SELECT freezer__items.*, freezer__trays.label AS tray_label FROM freezer__items JOIN freezer__trays ON freezer__items.tray_id = freezer__trays.id WHERE freezer__items.id = ?`,
                itemId,
            )
            .one() as FreezerItem;
    }

    moveItemToTray(itemId: number, trayId: number) {
        this.sql.exec(
            `UPDATE freezer__items SET tray_id = ? WHERE id = ?`,
            trayId,
            itemId,
        );
    }
}

export class FreezerRenderer {
    escape(s: unknown): string {
        return String(s)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");
    }

    humanizeDate(isoUtc: string): string {
        const date = new Date(isoUtc.replace(" ", "T") + "Z");
        const now = new Date();

        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffMonths = Math.floor(diffDays / 30);

        if (diffMins < 1) return "just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays <= 28) return `${diffDays}d ago`;
        return `${diffMonths}mo ago`;
    }

    scripts(): string {
        return ScriptsHtml;
    }

    header(): string {
        return HeaderHtml;
    }

    trayItemStyle(isoUtc: string): string {
        const date = new Date(`${isoUtc.replace(" ", "T")}Z`);
        const diffDays = (Date.now() - date.getTime()) / 86400000;

        if (diffDays >= 90) return "text-red-700";
        if (diffDays >= 60) return "text-orange-500";
        return "";
    }

    tray(tray: FreezerTray, items: FreezerItem[], index = 0): string {
        const label = "❄️ ".repeat(index + 1);
        const trayItems = items
            .filter((i) => i.tray_id === tray.id)
            .map((i) => this.trayItem(i))
            .join("");

        return TrayHtml.replaceAll("{{ tray_id }}", this.escape(tray.id))
            .replaceAll("{{ tray_label }}", label)
            .replace("{{ items }}", trayItems);
    }

    trays(trays: FreezerTray[], items: FreezerItem[]): string {
        const inner = trays.map((t, i) => this.tray(t, items, i)).join("");
        return AllTraysHtml.replace("{{ trays }}", inner);
    }

    trayItem(item: FreezerItem): string {
        return TrayItemHtml.replaceAll("{{ id }}", this.escape(item.id))
            .replaceAll("{{ quantity }}", this.escape(item.quantity ?? 1))
            .replaceAll("{{ name }}", this.escape(item.name))
            .replaceAll("{{ added_at }}", this.humanizeDate(item.added_at))
            .replaceAll("{{ added_at_iso }}", this.escape(item.added_at))
            .replaceAll(
                "{{ tray_item_style }}",
                this.trayItemStyle(item.added_at),
            );
    }

    trayItems(items: FreezerItem[]): string {
        return items.map((i) => this.trayItem(i)).join("");
    }
}
