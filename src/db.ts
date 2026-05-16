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
                title TEXT NOT NULL UNIQUE,
                poster_path TEXT,
                imdb_url TEXT NOT NULL UNIQUE,
                media_type TEXT NOT NULL,
                location TEXT,
                tags TEXT
            );
        `,
    },
    {
        name: "005-jennflix-queue",
        sql: `
            CREATE TABLE IF NOT EXISTS jennflix__queue(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title_id INTEGER NOT NULL REFERENCES jennflix__title(id),
                position INTEGER DEFAULT 0
            );
            CREATE UNIQUE INDEX IF NOT EXISTS jennflix__queue_title_id_unique
            ON jennflix__queue(title_id);
        `,
    },
    {
        name: "006-jennflix-watched",
        sql: `
            CREATE TABLE IF NOT EXISTS jennflix__watched(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title_id INTEGER NOT NULL REFERENCES jennflix__title(id),
                watched_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
        `,
    },
    {
        name: "007-jennflix-add-dvds",
        sql: `
            INSERT INTO jennflix__title (title, poster_path, imdb_url, media_type, location, tags) VALUES
    ('A Simple Wish', '/jennflix/posters/a_simple_wish.jpg', 'https://www.imdb.com/title/tt0120133/', 'film', 'DVD', 'fantasy,'),
    ('About Time', '/jennflix/posters/about_time.jpg', 'https://www.imdb.com/title/tt2194499/', 'film', 'DVD', 'romance,'),
    ('Austentatious', '/jennflix/posters/austentatious.jpg', 'https://www.imdb.com/title/tt8828340/', 'film', 'DVD', 'comedy,'),
    ('Back in Business', '/jennflix/posters/back_in_business.jpg', 'https://www.imdb.com/title/tt0463873/', 'film', 'DVD', 'comedy,'),
    ('Back to the Future', '/jennflix/posters/back_to_the_future.jpg', 'https://www.imdb.com/title/tt0088763/', 'film', 'DVD', 'sci_fi,'),
    ('Becoming Jane', '/jennflix/posters/becoming_jane.jpg', 'https://www.imdb.com/title/tt0416508/', 'film', 'DVD', 'period_drama,'),
    ('Bedknobs and Broomsticks', '/jennflix/posters/bedknobs_and_broomsticks.jpg', 'https://www.imdb.com/title/tt0066817/', 'film', 'DVD', 'fantasy,'),
    ('The Blues Brothers', '/jennflix/posters/blues_brothers_the.jpg', 'https://www.imdb.com/title/tt0080455/', 'film', 'DVD', 'musical,'),
    ('Bridget Jones''s Diary', '/jennflix/posters/bridget_jones_diary.jpg', 'https://www.imdb.com/title/tt0243155/', 'film', 'DVD', 'romcom,'),
    ('Bridget Jones: The Edge of Reason', '/jennflix/posters/bridget_jones_edge_of_reason.jpg', 'https://www.imdb.com/title/tt0317198/', 'film', 'DVD', 'romcom,'),
    ('Casino Royale', '/jennflix/posters/casino_royale.jpg', 'https://www.imdb.com/title/tt0381061/', 'film', 'DVD', 'spy,'),
    ('Chicken Run', '/jennflix/posters/chicken_run.jpg', 'https://www.imdb.com/title/tt0120630/', 'film', 'DVD', 'animation,'),
    ('Children of Men', '/jennflix/posters/children_of_men.jpg', 'https://www.imdb.com/title/tt0206634/', 'film', 'DVD', 'dystopian,'),
    ('Chitty Chitty Bang Bang', '/jennflix/posters/chitty_chitty_bang_bang.jpg', 'https://www.imdb.com/title/tt0062803/', 'film', 'DVD', 'musical,'),
    ('Star Wars: Clone Wars', '/jennflix/posters/clone_wars.jpg', 'https://www.imdb.com/title/tt0361243/', 'tv', 'DVD', 'sci_fi,'),
    ('Clueless', '/jennflix/posters/clueless.jpg', 'https://www.imdb.com/title/tt0112697/', 'film', 'DVD', 'teen_comedy,'),
    ('Coriolanus', '/jennflix/posters/coriolanus.jpg', 'https://www.imdb.com/title/tt1372686/', 'film', 'DVD', 'shakespeare,'),
    ('Dinnerladies', '/jennflix/posters/dinnerladies.jpg', 'https://www.imdb.com/title/tt0161140/', 'tv', 'DVD', 'sitcom,'),
    ('Divergent', '/jennflix/posters/divergent.jpg', 'https://www.imdb.com/title/tt1840309/', 'film', 'DVD', 'dystopian,'),
    ('Dorian Gray', '/jennflix/posters/dorian_gray.jpg', 'https://www.imdb.com/title/tt1235124/', 'film', 'DVD', 'gothic,'),
    ('Firefly', '/jennflix/posters/firefly.jpg', 'https://www.imdb.com/title/tt0303461/', 'tv', 'DVD', 'space_western,'),
    ('Galaxy Quest', '/jennflix/posters/galaxy_quest.jpg', 'https://www.imdb.com/title/tt0177789/', 'film', 'DVD', 'sci_fi_comedy,'),
    ('Gattaca', '/jennflix/posters/gattaca.jpg', 'https://www.imdb.com/title/tt0119177/', 'film', 'DVD', 'sci_fi,'),
    ('Great Expectations', '/jennflix/posters/great_expectations.jpg', 'https://www.imdb.com/title/tt1836808/', 'film', 'DVD', 'period_drama,'),
    ('Hamlet', '/jennflix/posters/hamlet.jpg', 'https://www.imdb.com/title/tt0116477/', 'film', 'DVD', 'shakespeare,'),
    ('Hercules', '/jennflix/posters/hercules.jpg', 'https://www.imdb.com/title/tt0119282/', 'film', 'DVD', 'animation,'),
    ('Hobbit: An Unexpected Journey, The', '/jennflix/posters/hobbit_an_unexpected_journey.jpg', 'https://www.imdb.com/title/tt0903624/', 'film', 'DVD', 'fantasy,'),
    ('Hobbit: The Battle of the Five Armies, The', '/jennflix/posters/hobbit_battle_of_the_five_armies.jpg', 'https://www.imdb.com/title/tt2310332/', 'film', 'DVD', 'fantasy,'),
    ('Hobbit: The Desolation of Smaug, The', '/jennflix/posters/hobbit_desolation_of_smaug.jpg', 'https://www.imdb.com/title/tt1170358/', 'film', 'DVD', 'fantasy,'),
    ('Hollow Crown, The', '/jennflix/posters/hollow_crown_the.jpg', 'https://www.imdb.com/title/tt2262456/', 'film', 'DVD', 'historical_drama,'),
    ('Hunger Games, The: Catching Fire', '/jennflix/posters/hunger_games_catching_fire.jpg', 'https://www.imdb.com/title/tt1951264/', 'film', 'DVD', 'dystopian,'),
    ('Hunger Games, The', '/jennflix/posters/hunger_games_the.jpg', 'https://www.imdb.com/title/tt1392170/', 'film', 'DVD', 'dystopian,'),
    ('I, Robot', '/jennflix/posters/i_robot.jpg', 'https://www.imdb.com/title/tt0343818/', 'film', 'DVD', 'sci_fi,'),
    ('Importance of Being Earnest, The', '/jennflix/posters/importance_of_being_earnest_the.jpg', 'https://www.imdb.com/title/tt0278500/', 'film', 'DVD', 'comedy,'),
    ('Incredibles, The', '/jennflix/posters/incredibles_the.jpg', 'https://www.imdb.com/title/tt0317705/', 'film', 'DVD', 'superhero,'),
    ('Insurgent', '/jennflix/posters/insurgent.jpg', 'https://www.imdb.com/title/tt2908446/', 'film', 'DVD', 'dystopian,'),
    ('Jane Eyre', '/jennflix/posters/jane_eyre.jpg', 'https://www.imdb.com/title/tt1229822/', 'film', 'DVD', 'gothic_romance,'),
    ('Jeeves and Wooster', '/jennflix/posters/jeeves_and_wooster.jpg', 'https://www.imdb.com/title/tt0098833/', 'tv', 'DVD', 'british_comedy,'),
    ('Lord of the Rings: The Fellowship of the Ring, The', '/jennflix/posters/lotr_fellowship_of_the_ring.jpg', 'https://www.imdb.com/title/tt0120737/', 'film', 'DVD', 'fantasy,'),
    ('Lord of the Rings: The Return of the King, The', '/jennflix/posters/lotr_return_of_the_king.jpg', 'https://www.imdb.com/title/tt0167260/', 'film', 'DVD', 'fantasy,'),
    ('Lord of the Rings: The Two Towers, The', '/jennflix/posters/lotr_the_two_towers.jpg', 'https://www.imdb.com/title/tt0167261/', 'film', 'DVD', 'fantasy,'),
    ('Mansfield Park', '/jennflix/posters/mansfield_park.jpg', 'https://www.imdb.com/title/tt0178737/', 'film', 'DVD', 'period_drama,'),
    ('Martian, The', '/jennflix/posters/martian_the.jpg', 'https://www.imdb.com/title/tt3659388/', 'film', 'DVD', 'sci_fi,'),
    ('Miss Potter', '/jennflix/posters/miss_potter.jpg', 'https://www.imdb.com/title/tt0482546/', 'film', 'DVD', 'biography,'),
    ('Moulin Rouge!', '/jennflix/posters/moulin_rouge.jpg', 'https://www.imdb.com/title/tt0203009/', 'film', 'DVD', 'musical,'),
    ('Mouse Hunt', '/jennflix/posters/mousehunt.jpg', 'https://www.imdb.com/title/tt0119715/', 'film', 'DVD', 'family_comedy,'),
    ('My Favorite Martian', '/jennflix/posters/my_favorite_martian.jpg', 'https://www.imdb.com/title/tt0120764/', 'film', 'DVD', 'sci_fi_comedy,'),
    ('Northanger Abbey', '/jennflix/posters/northanger_abbey.jpg', 'https://www.imdb.com/title/tt0844794/', 'film', 'DVD', 'period_drama,'),
    ('Oliver!', '/jennflix/posters/oliver.jpg', 'https://www.imdb.com/title/tt0063385/', 'film', 'DVD', 'musical,'),
    ('Oscar Wilde Collection, The', '/jennflix/posters/oscar_wilde_collection_the.jpg', '', 'tv', 'DVD', 'literary,'),
    ('Perfume: The Story of a Murderer', '/jennflix/posters/perfume.jpg', 'https://www.imdb.com/title/tt0396171/', 'film', 'DVD', 'psychological_thriller,'),
    ('Pride and Prejudice', '/jennflix/posters/pride_and_prejudice.jpg', 'https://www.imdb.com/title/tt0414387/', 'film', 'DVD', 'period_romance,'),
    ('Producers, The', '/jennflix/posters/producers_the.jpg', 'https://www.imdb.com/title/tt0395251/', 'film', 'DVD', 'musical_comedy,'),
    ('Quantum Leap', '/jennflix/posters/quantum_leap.jpg', 'https://www.imdb.com/title/tt0096684/', 'tv', 'DVD', 'sci_fi,'),
    ('Rocky Horror Picture Show, The', '/jennflix/posters/rocky_horror_picture_show_the.jpg', 'https://www.imdb.com/title/tt0073629/', 'film', 'DVD', 'cult_musical,'),
    ('Scarlet Pimpernel, The', '/jennflix/posters/scarlet_pimpernel.jpg', 'https://www.imdb.com/title/tt0084637/', 'film', 'DVD', 'swashbuckler,'),
    ('Serenity', '/jennflix/posters/serenity.jpg', 'https://www.imdb.com/title/tt0379786/', 'film', 'DVD', 'space_opera,'),
    ('Shakespeare Retold', '/jennflix/posters/shakespeare_retold.jpg', 'https://www.imdb.com/title/tt1062205/', 'tv', 'DVD', 'shakespeare,'),
    ('She''s the Man', '/jennflix/posters/shes_the_man.jpg', 'https://www.imdb.com/title/tt0454945/', 'film', 'DVD', 'teen_comedy,'),
    ('Simpsons Movie, The', '/jennflix/posters/simpsons_movie.jpg', 'https://www.imdb.com/title/tt0462538/', 'film', 'DVD', 'animation,'),
    ('Sister Act', '/jennflix/posters/sister_act.jpg', 'https://www.imdb.com/title/tt0105417/', 'film', 'DVD', 'musical_comedy,'),
    ('Sister Act 2', '/jennflix/posters/sister_act_2.jpg', 'https://www.imdb.com/title/tt0108147/', 'film', 'DVD', 'musical_comedy,'),
    ('Sound of Music, The', '/jennflix/posters/sound_of_music_the.jpg', 'https://www.imdb.com/title/tt0059742/', 'film', 'DVD', 'musical,'),
    ('South Pacific', '/jennflix/posters/south_pacific.jpg', 'https://www.imdb.com/title/tt0052225/', 'film', 'DVD', 'musical,'),
    ('Stargate', '/jennflix/posters/stargate.jpg', 'https://www.imdb.com/title/tt0111282/', 'film', 'DVD', 'sci_fi,'),
    ('The Mummy Trilogy', '/jennflix/posters/the_mummy_trilogy.jpg', 'https://www.imdb.com/title/tt0120616/', 'film', 'DVD', 'adventure,'),
    ('Titanic', '/jennflix/posters/titanic.jpg', 'https://www.imdb.com/title/tt0120338/', 'film', 'DVD', 'romance,'),
    ('Twilight', '/jennflix/posters/twilight.jpg', 'https://www.imdb.com/title/tt1099212/', 'film', 'DVD', 'paranormal_romance,'),
    ('V', '/jennflix/posters/v.jpg', 'https://www.imdb.com/title/tt0085106/', 'tv', 'DVD', 'sci_fi,'),
    ('Vicar of Dibley, The', '/jennflix/posters/vicar_of_dibley_the.jpg', 'https://www.imdb.com/title/tt0108981/', 'tv', 'DVD', 'sitcom,'),
    ('Wallace & Gromit 3 Cracking Adventures', '/jennflix/posters/wallace_gromit_3.jpg', 'https://www.imdb.com/title/tt0104361/', 'film', 'DVD', 'animation,'),
    ('Wallace & Gromit: A Matter of Loaf and Death', '/jennflix/posters/wallace_gromit_loaf_death.jpg', 'https://www.imdb.com/title/tt1118511/', 'film', 'DVD', 'animation,'),
    ('West Side Story', '/jennflix/posters/west_side_story.jpg', 'https://www.imdb.com/title/tt0055614/', 'film', 'DVD', 'musical,'),
    ('Who Framed Roger Rabbit', '/jennflix/posters/who_framed_roger_rabbit.jpg', 'https://www.imdb.com/title/tt0096438/', 'film', 'DVD', 'animation,')
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
