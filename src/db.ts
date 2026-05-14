const MIGRATIONS = [
    {
        name: "001-initial",
        sql: `
            CREATE TABLE IF NOT EXISTS freezer__items(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL CHECK(LENGTH(TRIM(name)) > 0),
                quantity INTEGER,
                added_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
        `,
    },
    {
        name: "002-add-freezers",
        sql: `
            CREATE TABLE IF NOT EXISTS freezer__freezers(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                label TEXT NOT NULL
            );
        `,
    },
    {
        name: "003-add-trays",
        sql: `
            CREATE TABLE IF NOT EXISTS freezer__trays(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                freezer_id INTEGER NOT NULL REFERENCES freezer__freezers(id),
                label TEXT NOT NULL
            );
            ALTER TABLE freezer__items ADD COLUMN tray_id INTEGER NOT NULL REFERENCES freezer__trays(id);
        `,
    },
    {
        name: "004-jennflix-title",
        sql: `
            CREATE TABLE IF NOT EXISTS jennflix__title(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                imdb_url TEXT NOT NULL,
                tags TEXT
            );
        `,
    },
    {
        name: "005-jennflix-queue",
        sql: `
            CREATE TABLE IF NOT EXISTS jennflix__queue(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title_id INTEGER NOT NULL REFERENCES jennflix__title(id)
            );
        `,
    },
];

export function runMigrations(sql: SqlStorage): void {
    sql.exec(`
        CREATE TABLE IF NOT EXISTS migrations(
            name TEXT PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `);

    for (const migration of MIGRATIONS) {
        const already = sql
            .exec("SELECT 1 FROM migrations WHERE name = ?", [migration.name])
            .toArray();
        if (already.length === 0) {
            sql.exec(migration.sql);
            sql.exec("INSERT INTO migrations (name) VALUES (?)", [
                migration.name,
            ]);
        }
    }
}
