import { DurableObject } from "cloudflare:workers";
import type { IncomingRequestCfProperties } from "@cloudflare/workers-types";
import { runMigrations } from "./db";
import { type Freezer, FreezerRenderer, FreezerRepository } from "./freezer";
import NewFreezerHtml from "./freezer/templates/freezer_new.html";
import { JennflixRenderer, JennflixRepository } from "./jennflix";
import FreezerHtml from "./templates/freezer.html";
import HomeHtml from "./templates/home.html";
import HomeContentHtml from "./templates/home_content.html";
import FreezerQrHtml from "./templates/qr.html";

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
    jennflix: JennflixRepository;
    jennflixRenderer: JennflixRenderer;

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);

        const sql = ctx.storage.sql;
        ctx.blockConcurrencyWhile(async () => runMigrations(ctx.storage.sql));

        this.freezer = new FreezerRepository(sql);
        this.freezerRenderer = new FreezerRenderer();
        this.jennflix = new JennflixRepository(sql);
        this.jennflixRenderer = new JennflixRenderer();
    }

    // -----------------------------------------------------------------------------------
    // -----------------------------------------------------------------------------------

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
        const listHtml = this.freezerRenderer.trayItems(items);

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

    async freezer_incrementItemCount(itemId: number): Promise<Response> {
        const updated = this.freezer.incrementItemCount(itemId);
        if (!updated) {
            return new Response("Not found", { status: 404 });
        }
        return new Response(this.freezerRenderer.trayItem(updated), {
            headers: { "Content-Type": "text/html" },
        });
    }

    async freezer_moveItemToTray(
        itemId: number,
        trayId: number,
    ): Promise<Response> {
        this.freezer.moveItemToTray(itemId, trayId);
        const freezer = this.freezer_getActive();
        if (!freezer) return new Response("Not found", { status: 404 });
        return new Response(this.renderTrays(freezer.id), {
            headers: { "Content-Type": "text/html" },
        });
    }

    private renderTrays(freezerId: number): string {
        const trays = this.freezer.listTrays(freezerId);
        const items = this.freezer.listItemsByFreezer(freezerId);
        return this.freezerRenderer.trays(trays, items);
    }

    private renderFreezer(freezerId: number): Response {
        const html =
            this.freezerRenderer.scripts() +
            this.freezerRenderer.header() +
            this.renderTrays(freezerId);

        return new Response(html, {
            headers: { "Content-Type": "text/html" },
        });
    }

    async freezerUi(): Promise<Response> {
        const freezer = this.freezer_getActive();
        const html = this.freezerRenderer.scripts() + NewFreezerHtml;

        if (!freezer) {
            return new Response(html, {
                headers: { "Content-Type": "text/html" },
            });
        }

        return this.renderFreezer(freezer.id);
    }

    // -----------------------------------------------------------------------------------
    // -----------------------------------------------------------------------------------

    private renderJennflix(urlPathname = ""): Response {
        const titles = this.jennflix.listTitles();
        const queue = this.jennflix.listQueue();
        const queuedTitleIds = new Set(queue.map((item) => item.title_id));
        const html =
            this.jennflixRenderer.scripts() +
            this.jennflixRenderer.header(urlPathname) +
            this.jennflixRenderer.queue(titles, queue) +
            this.jennflixRenderer.titles(titles, queuedTitleIds);

        return new Response(html, {
            headers: { "Content-Type": "text/html" },
        });
    }

    async jennflixUi(urlPathname: string): Promise<Response> {
        return this.renderJennflix(urlPathname);
    }

    async jennflix_newTitleForm(urlPathname: string): Promise<Response> {
        const html =
            this.jennflixRenderer.scripts() +
            this.jennflixRenderer.header(urlPathname) +
            this.jennflixRenderer.newTitleForm();
        return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    async jennflix_addTitle(
        title: string,
        posterPath: string,
        imdbUrl: string,
        tags: string,
    ): Promise<Response> {
        if (!title || !imdbUrl) {
            return new Response("Title and IMDB URL required", { status: 422 });
        }
        this.jennflix.addTitle(title, posterPath, imdbUrl, tags);
        return this.renderJennflix();
    }

    async jennflix_addToQueue(title_id: number): Promise<Response> {
        if (!title_id) return new Response("Missing title_id", { status: 422 });
        this.jennflix.addToQueue(title_id);
        return this.renderJennflix();
    }

    async jennflix_removeFromQueue(id: number): Promise<Response> {
        this.jennflix.removeFromQueue(id);
        return this.renderJennflix();
    }

    async jennflix_editTitleForm(
        id: number,
        urlPathname = "",
    ): Promise<Response> {
        const title = this.jennflix.getTitle(id);
        if (!title) return new Response("Not found", { status: 404 });
        const html =
            this.jennflixRenderer.scripts() +
            this.jennflixRenderer.header(urlPathname) +
            this.jennflixRenderer.editTitleForm(title);
        return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    async jennflix_updateTitle(
        id: number,
        title: string,
        poster_path: string,
        imdb_url: string,
        tags: string,
    ): Promise<Response> {
        if (!title || !imdb_url) {
            return new Response("Title and IMDB URL required", { status: 422 });
        }
        this.jennflix.updateTitle(id, title, poster_path, imdb_url, tags);
        return this.renderJennflix();
    }

    async jennflix_deleteTitle(id: number): Promise<Response> {
        this.jennflix.deleteTitle(id);
        return this.renderJennflix();
    }

    async jennflix_moveQueueItem(
        id: number,
        direction: "up" | "down",
    ): Promise<Response> {
        if (direction !== "up" && direction !== "down") {
            return new Response("Invalid direction", { status: 422 });
        }
        this.jennflix.moveQueueItem(id, direction);
        return this.renderJennflix();
    }

    async jennflix_markWatched(id: number): Promise<Response> {
        this.jennflix.markWatched(id);
        return this.renderJennflix();
    }
}

function isFromAllowedCountry(
    request: Request & { cf?: IncomingRequestCfProperties },
    allowedCountries: string[],
): boolean {
    // <https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties>
    const country = request.cf?.country;
    return !!country && allowedCountries.includes(country);
}

async function botHoneypot(form: FormData): Promise<Response | undefined> {
    if (form.get("_email")) {
        return new Response("Bad request", { status: 400 });
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
        const allowedCountries = env.ALLOWED_COUNTRIES.split(",")
            .map((c: string) => c.trim())
            .filter(Boolean);
        if (!isFromAllowedCountry(request, allowedCountries)) {
            return new Response("Forbidden", { status: 403 });
        }

        const url = new URL(request.url);

        // Create a stub to open a communication channel with the Durable Object
        // instance named "casa".
        //
        // Requests from all Workers to the Durable Object instance named "casa"
        // will go to a single remote Durable Object instance.
        const stub = env.CASA_DURABLE_OBJECT.getByName(DURABLE_OBJECT_NAME);

        const isHtmx = request.headers.get("HX-Request") === "true";
        const htmlShell = (content: string) =>
            HomeHtml.replace("<!--HOME_ADDRESS-->", env.HOME_ADDRESS).replace(
                "<!--CONTENT-->",
                content,
            );

        // -----------------------------------------------------------------------------------
        // STATIC ASSETS
        // -----------------------------------------------------------------------------------

        if (
            url.pathname.startsWith("/posters/") ||
            url.pathname.startsWith("/static/") ||
            url.pathname === "/favicon.ico"
        ) {
            return env.ASSETS.fetch(request);
        }

        // -----------------------------------------------------------------------------------
        // -----------------------------------------------------------------------------------

        if (url.pathname === "/") {
            if (isHtmx) {
                return new Response(HomeContentHtml, {
                    headers: { "Content-Type": "text/html" },
                });
            }
            return new Response(htmlShell(HomeContentHtml), {
                headers: { "Content-Type": "text/html" },
            });
        }

        // -----------------------------------------------------------------------------------
        // -----------------------------------------------------------------------------------

        if (url.pathname === "/freezer/qr") {
            const qrUrl = `${url.origin}/freezer`;
            const html = FreezerQrHtml.replaceAll("<!--QR_URL-->", qrUrl);
            return new Response(html, {
                headers: { "Content-Type": "text/html" },
            });
        }

        if (["/freezer", "/freezer/"].includes(url.pathname)) {
            if (isHtmx) {
                return new Response(FreezerHtml, {
                    headers: { "Content-Type": "text/html" },
                });
            }
            return new Response(htmlShell(FreezerHtml), {
                headers: { "Content-Type": "text/html" },
            });
        }

        if (url.pathname === "/freezerUi") {
            return stub.freezerUi();
        }

        if (url.pathname === "/freezers" && request.method === "POST") {
            const form = await request.formData();
            const label = String(form.get("label") ?? "").trim();
            const trayCount = Number(form.get("tray_count") ?? 0);
            if (!label) {
                return new Response("Freezer label is required", {
                    status: 422,
                });
            }
            if (!Number.isInteger(trayCount) || trayCount < 1) {
                return new Response("Tray count must be at least 1", {
                    status: 422,
                });
            }
            return stub.freezer_create(label, trayCount);
        }

        if (
            url.pathname.startsWith("/freezers/trays/") &&
            request.method === "POST"
        ) {
            const trayId = Number(url.pathname.split("/")[3]);

            const form = await request.formData();
            const name = String(form.get("name")).trim();
            if (!name) {
                return new Response("Item name is required", { status: 422 });
            }

            return stub.freezer_addItem(trayId, name);
        }

        const decrementMatch = url.pathname.match(
            /^\/freezers\/items\/(\d+)\/decrement$/,
        );
        if (decrementMatch && request.method === "POST") {
            const form = await request.formData();
            await botHoneypot(form);
            return stub.freezer_decrementItemCount(Number(decrementMatch[1]));
        }

        const incrementMatch = url.pathname.match(
            /^\/freezers\/items\/(\d+)\/increment$/,
        );
        if (incrementMatch && request.method === "POST") {
            const form = await request.formData();
            await botHoneypot(form);
            return stub.freezer_incrementItemCount(Number(incrementMatch[1]));
        }

        const moveMatch = url.pathname.match(
            /^\/freezers\/items\/(\d+)\/move$/,
        );
        if (moveMatch && request.method === "POST") {
            const form = await request.formData();
            await botHoneypot(form);
            return stub.freezer_moveItemToTray(
                Number(moveMatch[1]),
                Number(form.get("tray_id")),
            );
        }

        // -----------------------------------------------------------------------------------
        // -----------------------------------------------------------------------------------

        if (
            ["/jennflix", "/jennflix/"].includes(url.pathname) &&
            request.method === "GET"
        ) {
            if (isHtmx) return stub.jennflixUi(url.pathname);
            const content = await stub.jennflixUi(url.pathname);
            const html = await content.text();
            return new Response(htmlShell(html), {
                headers: { "Content-Type": "text/html" },
            });
        }

        if (
            url.pathname === "/jennflix/titles/new" &&
            request.method === "GET"
        ) {
            if (isHtmx) return stub.jennflix_newTitleForm(url.pathname);
            const content = await stub.jennflix_newTitleForm(url.pathname);
            const html = await content.text();
            return new Response(htmlShell(html), {
                headers: { "Content-Type": "text/html" },
            });
        }

        if (url.pathname === "/jennflix/titles" && request.method === "POST") {
            const form = await request.formData();
            return stub.jennflix_addTitle(
                String(form.get("title") ?? "").trim(),
                String(form.get("poster_path") ?? "").trim(),
                String(form.get("imdb_url") ?? "").trim(),
                String(form.get("tags") ?? "").trim(),
            );
        }

        const editTitleMatch = url.pathname.match(
            /^\/jennflix\/titles\/(\d+)\/edit$/,
        );
        if (editTitleMatch) {
            const id = Number(editTitleMatch[1]);
            if (request.method === "GET") {
                if (isHtmx) return stub.jennflix_editTitleForm(id);
                const content = await stub.jennflix_editTitleForm(id);
                const html = await content.text();
                return new Response(htmlShell(html), {
                    headers: { "Content-Type": "text/html" },
                });
            }
            if (request.method === "POST") {
                const form = await request.formData();
                return stub.jennflix_updateTitle(
                    id,
                    String(form.get("title") ?? "").trim(),
                    String(form.get("poster_path") ?? "").trim(),
                    String(form.get("imdb_url") ?? "").trim(),
                    String(form.get("tags") ?? "").trim(),
                );
            }
        }

        const deleteTitleMatch = url.pathname.match(
            /^\/jennflix\/titles\/(\d+)\/delete$/,
        );
        if (deleteTitleMatch && request.method === "POST") {
            return stub.jennflix_deleteTitle(Number(deleteTitleMatch[1]));
        }

        if (url.pathname === "/jennflix/queue" && request.method === "POST") {
            const form = await request.formData();
            return stub.jennflix_addToQueue(Number(form.get("title_id")));
        }

        const moveQueueMatch = url.pathname.match(
            /^\/jennflix\/queue\/(\d+)\/move$/,
        );
        if (moveQueueMatch && request.method === "POST") {
            const form = await request.formData();
            return stub.jennflix_moveQueueItem(
                Number(moveQueueMatch[1]),
                String(form.get("direction")) as "up" | "down",
            );
        }

        const watchedQueueMatch = url.pathname.match(
            /^\/jennflix\/queue\/(\d+)\/watched$/,
        );
        if (watchedQueueMatch && request.method === "POST") {
            return stub.jennflix_markWatched(Number(watchedQueueMatch[1]));
        }

        const removeQueueMatch = url.pathname.match(
            /^\/jennflix\/queue\/(\d+)\/remove$/,
        );
        if (removeQueueMatch && request.method === "POST") {
            return stub.jennflix_removeFromQueue(Number(removeQueueMatch[1]));
        }

        return new Response("Not found", { status: 404 });
    },
} satisfies ExportedHandler<Env>;
