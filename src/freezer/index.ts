type FreezerItem = {
    id: number;
    name: string;
    quantity: number;
    added_at: string; // ISO 8601 UTC, e.g. "2024-01-15 13:45:00",
};

export class Freezer {
    constructor(private sql: SqlStorage) {}

    listItems() {
        return this.sql.exec("SELECT * FROM freezer__items").toArray();
    }

    addItem(name: string) {
        this.sql.exec(
            "INSERT INTO freezer__items (name, quantity) VALUES (?, 1)",
            [name],
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
  ${this.escape(r.name)} (${r.quantity ?? 1}) [${this.escape(r.added_at)}]
</li>`,
            )
            .join("");
    }
}
