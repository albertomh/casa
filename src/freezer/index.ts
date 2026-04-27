type Freezer = {
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
            .exec("SELECT * FROM freezer__trays WHERE freezer_id = ?", [
                freezer_id,
            ])
            .toArray() as FreezerTray[];
    }

    addTray(freezer_id: number, label: string) {
        this.sql.exec(
            "INSERT INTO freezer__trays (freezer_id, label) VALUES (?, ?)",
            [freezer_id, label],
        );
    }

    listItemsByFreezer(freezer_id: number) {
        return this.sql
            .exec(
                `SELECT freezer__items.*, freezer__trays.label AS tray_label
                FROM freezer__items
                JOIN freezer__trays ON freezer__items.tray_id = freezer__trays.id
                WHERE freezer__trays.freezer_id = ?`,
                [freezer_id],
            )
            .toArray() as FreezerItem[];
    }

    addItem(tray_id: number, name: string, quantity = 1) {
        this.sql.exec(
            "INSERT INTO freezer__items (tray_id, name, quantity) VALUES (?, ?, ?)",
            [tray_id, name, quantity],
        );
    }
}

export class FreezerRenderer {
    private escape(s: unknown): string {
        return String(s)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");
    }

    list(items: FreezerItem[]): string {
        return items
            .map(
                (r) => `
<li id="item-${r.id}">
  (${r.quantity ?? 1}) ${this.escape(r.name)} [${this.escape(r.added_at)}]
</li>`,
            )
            .join("");
    }
}
