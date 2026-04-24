const MIGRATIONS = [
    {
        name: "001-initial",
        sql: `
            CREATE TABLE IF NOT EXISTS freezer__items(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                quantity INTEGER,
                added_at TEXT NOT NULL DEFAULT (datetime('now'))
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
