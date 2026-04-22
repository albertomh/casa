import { DurableObject } from "cloudflare:workers";

/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

const DURABLE_OBJECT_NAME = "casa";

import HomepageHtml from "./index.html";

function initDatabaseSchema(sql: SqlStorage): void {
    sql.exec(`CREATE TABLE IF NOT EXISTS freezer__items(
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT,
		quantity INTEGER)`);
}

/** A Durable Object's behavior is defined in an exported Javascript class */
export class CasaDurableObject extends DurableObject<Env> {
    sql: SqlStorage;
    /**
     * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
     * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
     *
     * @param ctx - The interface for interacting with Durable Object state
     * @param env - The interface to reference bindings declared in wrangler.jsonc
     */
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        this.sql = ctx.storage.sql;

        initDatabaseSchema(this.sql);
    }

    async getItems(): Promise<Response> {
        const rows = this.sql.exec("SELECT * FROM freezer__items").toArray();

        const html = rows
            .map((r) => `<li>${r.name} (${r.quantity ?? 1})</li>`)
            .join("");

        return new Response(html, {
            headers: { "Content-Type": "text/html" },
        });
    }

    async addItem(name: string): Promise<Response> {
        this.sql.exec(
            "INSERT INTO freezer__items (name, quantity) VALUES (?, 1)",
            [name],
        );

        return this.getItems();
    }
}

export default {
    /**
     * This is the standard fetch handler for a Cloudflare Worker
     *
     * @param request - The request submitted to the Worker from the client
     * @param env - The interface to reference bindings declared in wrangler.jsonc
     * @param ctx - The execution context of the Worker
     * @returns The response to be sent back to the client
     */
    async fetch(request, env, ctx): Promise<Response> {
        const url = new URL(request.url);

        // Create a stub to open a communication channel with the Durable Object
        // instance named "casa".
        //
        // Requests from all Workers to the Durable Object instance named "casa"
        // will go to a single remote Durable Object instance.
        const stub = env.CASA_DURABLE_OBJECT.getByName(DURABLE_OBJECT_NAME);

        if (url.pathname === "/") {
            return new Response(HomepageHtml, {
                headers: { "Content-Type": "text/html" },
            });
        }

        if (url.pathname === "/items" && request.method === "GET") {
            return stub.getItems();
        }

        if (url.pathname === "/items" && request.method === "POST") {
            const formData = await request.formData();
            const name = formData.get("name");
            return stub.addItem(name);
        }

        return new Response("Not found", { status: 404 });
    },
} satisfies ExportedHandler<Env>;
