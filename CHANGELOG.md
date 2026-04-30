# Changelog

## 1.0.0 (2026-04-30)


### Features

* Add a lightweight database migrations system ([fc5fce7](https://github.com/albertomh/casa/commit/fc5fce7d3c13a635444ff1466e239bf7cecd9a9a))
* Add background gradient to Freezer tray &lt;summary&gt; ([30756e5](https://github.com/albertomh/casa/commit/30756e590927aa75e58f276875a576c06dcf9066))
* Add DaisyUI to the index.html entrypoint ([2147f07](https://github.com/albertomh/casa/commit/2147f074f0c8878980473e5ad9f4da79fb026e34))
* Add decrement button to freezer items, delete at zero ([fb0d9c1](https://github.com/albertomh/casa/commit/fb0d9c1678531130d344c5837a7856659b346f35))
* Add homepage with minimal HTMX-powered form ([6934db8](https://github.com/albertomh/casa/commit/6934db8dfb72d0e707e609b70836686dd25aed5c))
* Add humanized timestamps for each Freezer item ([f25c558](https://github.com/albertomh/casa/commit/f25c558088dc8b3c837f541e54bcd737a8a93ad5))
* Add humanized/ISO 8601 date toggle ([bc6cfe8](https://github.com/albertomh/casa/commit/bc6cfe8bcd2ee13b3171c33d0b8ae2fea92acdd3))
* Add multiple Freezers + per-Freezer Trays ([aadce63](https://github.com/albertomh/casa/commit/aadce63ba5132fe1125a11a6cbf31df34bc856fc))
* Add title to header ([1a3f237](https://github.com/albertomh/casa/commit/1a3f237cd2508393ac6f2f065f4461fd618d8980))
* Allow items to be drag-and-dropped between Freezer Trays ([49c61a6](https://github.com/albertomh/casa/commit/49c61a615d4ce9c370adcb508bcdc8d749fc8022))
* Colour-code Freezer Item timestamps by age ([533f7f1](https://github.com/albertomh/casa/commit/533f7f1f3f5ac4fb2883e418882b77556e0e29d4))
* Each Freezer tray is an accordion item ([478c21d](https://github.com/albertomh/casa/commit/478c21dd8fd2894e49c457f2ced5db7e24022dc0))
* Expand the FreezerRepository with management methods ([049a911](https://github.com/albertomh/casa/commit/049a911d9784c9fe724cb1daffe75ae372229896))
* Gate requests based on country of origin ([31ddf8e](https://github.com/albertomh/casa/commit/31ddf8e24a155c58ea27c575248d076031106989))
* Implement /freezers/items/&lt;ID&gt;/increment ([98df623](https://github.com/albertomh/casa/commit/98df62396ba33c2c397c9ee40c4aae880bf7480a))
* Initialise project via 'create cloudflare@latest durable-object-starter' ([2c0e57e](https://github.com/albertomh/casa/commit/2c0e57ef53e62e54e9373d738b93e5aa2533bc6b))
* Minimal 'new Freezer' and per-Tray item form ([a0b5980](https://github.com/albertomh/casa/commit/a0b598077ea9b08f7b39f4e9dcd8cdcadc119273))
* Replace Freezer tray headings with snowflake emoji ([eb63273](https://github.com/albertomh/casa/commit/eb632733d43b5cee8d7b356cd96ba7443e4b9fac))
* Store home address as a wrangler secret ([#6](https://github.com/albertomh/casa/issues/6)) ([378107e](https://github.com/albertomh/casa/commit/378107e80d4184b2ab78177b761b839275beda3f))


### Bug Fixes

* Add viewport meta tag ([1b085f7](https://github.com/albertomh/casa/commit/1b085f7bdb16b5b0dd77dc8788aa44ffd3e07c97))
* **ci:** Specify pnpm version in CI ([#2](https://github.com/albertomh/casa/issues/2)) ([25939db](https://github.com/albertomh/casa/commit/25939db852e4a9704eb1449528413be21507b46d))
* Clear tray item input after submission ([b04eb9a](https://github.com/albertomh/casa/commit/b04eb9abc1ff1109a16d74a7c7d7d4ec89565d37))
* Clear tray item input after submit ([1ab9067](https://github.com/albertomh/casa/commit/1ab9067dd27537625da2af71e94d345132d4b850))
* Float Freezer Item timestamps to end on mobile viewports ([41bdfb9](https://github.com/albertomh/casa/commit/41bdfb925079a6e7d6b122709958cc01039af262))
* Make header background white ([79729ef](https://github.com/albertomh/casa/commit/79729efaf67166d059b7879d960d8e2ae4ab41f5))
* Reset forms via global htmx:afterRequest listener instead of inline hx-on ([fd777a1](https://github.com/albertomh/casa/commit/fd777a17013f316c667149bc2ebb9534b14389d5))
* Retrieve Freezer Items sorted by added_at timestamp ([6757fce](https://github.com/albertomh/casa/commit/6757fce88531e061d1975e8b55ccdb53da92ddd8))
* Style Freezer Trays on hover ([b384bfb](https://github.com/albertomh/casa/commit/b384bfbba54087c66a0c41adffd21bd39d8eb0ec))
* Wrap non-HTMX requests in &lt;html&gt; & &lt;body&gt; tags ([849615f](https://github.com/albertomh/casa/commit/849615f03aa6d792e7d1ac47255a1b0b6e60cc4e))
