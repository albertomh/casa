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
    {
        name: "002-add-freezers",
        sql: `
            CREATE TABLE IF NOT EXISTS freezers(
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
                freezer_id INTEGER NOT NULL REFERENCES freezers(id),
                label TEXT NOT NULL
            );
            ALTER TABLE freezer__items ADD COLUMN tray_id INTEGER NOT NULL REFERENCES freezer__trays(id);
            CREATE INDEX IF NOT EXISTS idx_freezer__items_tray_id ON freezer__items(tray_id);
            CREATE INDEX IF NOT EXISTS idx_freezer__trays_freezer_id ON freezer__trays(freezer_id);
        `,
    },
    {
        name: "004-seed-data",
        sql: `
            INSERT INTO freezers (label) VALUES ('Bosch');
            INSERT INTO freezer__trays (
                freezer_id, label
            ) VALUES
                (1, 'Tray 1'),
                (1, 'Tray 2'),
                (1, 'Tray 3')
            ;
            INSERT INTO freezer__items (
                name, quantity, tray_id, added_at
            ) VALUES
                ('🍨 Mackie''s milk ice cream', 1, 1, '2026-02-01 09:00:00'),
                ('🍨 B&J''s Strawberry Doughnut-eee', 2, 1, '2026-03-01 09:00:00'),
                ('🍭 Ice pops', 10, 1, '2026-04-25 09:00:00'),
                ('🍨 B&J''s Peanut Butter Cup', 1, 1, '2026-04-25 09:00:00'),
                /** */
                ('🥚 Egg yolks', 5, 2, '2025-05-01 09:00:00'),
                ('🦃 Turkey sausages', 2, 2, '2025-10-13 09:00:00'),
                ('Nutroast', 4, 2, '2025-12-24 09:00:00'),
                ('🍲 Veg stock', 1, 2, '2025-12-25 09:00:00'),
                ('🐖 Pork sausages', 7, 2, '2026-03-22 09:00:00'),
                ('Soffritto', 3, 2, '2026-04-11 09:00:00'),
                ('🦌 Venison sausages', 2, 2, '2026-04-18 09:00:00'),
                ('🦌 Venison sausages', 2, 2, '2026-04-18 09:00:00'),
                ('🦌 Venison sausages', 2, 2, '2026-04-18 09:00:00'),
                ('🫓 Parantha', 4, 2, '2026-04-25 09:00:00'),
                ('Mexican beef gravy', 1, 2, '2026-04-27 09:00:00'),
                /** */
                ('🥟 Itsu korean beef gyoza', 1, 3, '2025-11-01 09:00:00'),
                ('🥔 Mash', 2, 3, '2025-12-18 09:00:00'),
                ('Petit pois', 1, 3, '2026-02-01 09:00:00'),
                ('🫛 Edamame', 2, 3, '2026-04-25 09:00:00')
                ;
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
        console.log("Running migration:", migration.name);
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
