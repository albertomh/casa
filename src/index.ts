import { DurableObject } from "cloudflare:workers";
import FreezerFormHtml from "./templates/freezer/form.html";
import HomepageHtml from "./templates/index.html";

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

type FreezerItem = {
    id: number;
    name: string;
    quantity: number;
};

function initDatabaseSchema(sql: SqlStorage): void {
    sql.exec(`CREATE TABLE IF NOT EXISTS freezer__items(
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT,
		quantity INTEGER)`);
}

class Freezer {
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

class FreezerRenderer {
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
  ${this.escape(r.name)} (${r.quantity ?? 1})
</li>`,
            )
            .join("");
    }
}

/** A Durable Object's behavior is defined in an exported Javascript class */
export class CasaDurableObject extends DurableObject<Env> {
    freezer: Freezer;
    freezerRenderer: FreezerRenderer;

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);

        const sql = ctx.storage.sql;
        initDatabaseSchema(sql);

        this.freezer = new Freezer(sql);
        this.freezerRenderer = new FreezerRenderer();
    }

    async freezer_getItems(): Promise<Response> {
        const items = this.freezer.listItems();
        const listHtml = this.freezerRenderer.list(items);

        return new Response(listHtml, {
            headers: { "Content-Type": "text/html" },
        });
    }

    async freezer_addItem(name: string): Promise<Response> {
        this.freezer.addItem(name);
        const items = this.freezer.listItems();
        const listHtml = this.freezerRenderer.list(items);

        return new Response(listHtml + FreezerFormHtml, {
            headers: { "Content-Type": "text/html" },
        });
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
    async fetch(request, env, _ctx): Promise<Response> {
        const url = new URL(request.url);

        // Create a stub to open a communication channel with the Durable Object
        // instance named "casa".
        //
        // Requests from all Workers to the Durable Object instance named "casa"
        // will go to a single remote Durable Object instance.
        const stub = env.CASA_DURABLE_OBJECT.getByName(DURABLE_OBJECT_NAME);

        if (url.pathname === "/") {
            const html = (HomepageHtml as string).replace(
                "{{ freezer-form }}",
                FreezerFormHtml,
            );
            return new Response(html, {
                headers: { "Content-Type": "text/html" },
            });
        }

        if (url.pathname === "/freezer/items" && request.method === "GET") {
            return stub.freezer_getItems();
        }

        if (url.pathname === "/freezer/items" && request.method === "POST") {
            const formData = await request.formData();
            const name = formData.get("name");
            return stub.freezer_addItem(name);
        }

        return new Response("Not found", { status: 404 });
    },
} satisfies ExportedHandler<Env>;
