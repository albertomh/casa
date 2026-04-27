import { DurableObject } from "cloudflare:workers";
import { runMigrations } from "./db";
import { FreezerRenderer, FreezerRepository } from "./freezer";
import NewFreezerHtml from "./freezer/templates/new_freezer.html";
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

export class CasaDurableObject extends DurableObject<Env> {
    freezer: FreezerRepository;
    freezerRenderer: FreezerRenderer;

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);

        const sql = ctx.storage.sql;
        ctx.blockConcurrencyWhile(async () => runMigrations(ctx.storage.sql));

        this.freezer = new FreezerRepository(sql);
        this.freezerRenderer = new FreezerRenderer();
    }

    private freezer_getActive(): Freezer | null {
        return this.freezer.getFirstFreezer();
    }

    async freezer_create(label: string, trayCount: number): Promise<Response> {
        const id = this.freezer.createFreezer(label);
        this.freezer.createTraySet(id, trayCount);

        return this.renderFreezer(id);
    }

    async freezer_getItems(): Promise<Response> {
        const freezer = this.freezer_getActive();
        if (!freezer) throw new Error("no freezer");

        const items = this.freezer.listItemsByFreezer(freezer.id);
        const listHtml = this.freezerRenderer.list(items);

        return new Response(listHtml, {
            headers: { "Content-Type": "text/html" },
        });
    }

    async freezer_addItem(trayId: number, name: string): Promise<Response> {
        this.freezer.addItem(trayId, name);

        const freezerId = this.freezer.getFreezerIdByTray(trayId);
        if (!freezerId) {
            return new Response("Tray not found", { status: 404 });
        }

        const items = this.freezer.listItemsByFreezer(freezerId);
        const trayItems = items.filter((i) => i.tray_id === trayId);

        return new Response(this.freezerRenderer.trayItems(trayItems), {
            headers: { "Content-Type": "text/html" },
        });
    }

    async freezer_decrementItemCount(itemId: number): Promise<Response> {
        const updated = this.freezer.decrementItemCount(itemId);
        if (!updated) {
            return new Response("", {
                headers: { "Content-Type": "text/html" },
            });
        }
        return new Response(this.freezerRenderer.trayItem(updated), {
            headers: { "Content-Type": "text/html" },
        });
    }
    private renderFreezer(freezerId: number): Response {
        const trays = this.freezer.listTrays(freezerId);
        const items = this.freezer.listItemsByFreezer(freezerId);

        const html = this.freezerRenderer.trays(trays, items);

        return new Response(html, {
            headers: { "Content-Type": "text/html" },
        });
    }

    async ui(): Promise<Response> {
        const freezer = this.freezer_getActive();

        if (!freezer) {
            return new Response(NewFreezerHtml, {
                headers: { "Content-Type": "text/html" },
            });
        }

        return this.renderFreezer(freezer.id);
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
            return new Response(HomepageHtml, {
                headers: { "Content-Type": "text/html" },
            });
        }

        if (url.pathname === "/ui") {
            return stub.ui();
        }

        if (url.pathname === "/freezers" && request.method === "POST") {
            const form = await request.formData();
            return stub.freezer_create(
                String(form.get("label")),
                Number(form.get("tray_count")),
            );
        }

        if (
            url.pathname.startsWith("/freezers/trays/") &&
            request.method === "POST"
        ) {
            const trayId = Number(url.pathname.split("/")[3]);

            const formData = await request.formData();
            const name = String(formData.get("name"));

            return stub.freezer_addItem(trayId, name);
        }

        if (url.pathname === "/freezers/items" && request.method === "GET") {
            return stub.freezer_getItems();
        }

        if (url.pathname === "/freezers/items" && request.method === "POST") {
            const formData = await request.formData();
            const name = formData.get("name");
            return stub.freezer_addItem(name);
        }

        const decrementMatch = url.pathname.match(
            /^\/freezers\/items\/(\d+)\/decrement$/,
        );
        if (decrementMatch && request.method === "POST") {
            return stub.freezer_decrementItemCount(Number(decrementMatch[1]));
        }

        return new Response("Not found", { status: 404 });
    },
} satisfies ExportedHandler<Env>;
