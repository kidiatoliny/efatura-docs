# efatura-docs

Documentation site for [@akira-io/efatura](https://github.com/akira-io/node-efatura), built with
[Astro](https://astro.build). The site mirrors the `docs/` tree of the node-efatura repository.

## How the mirror works

The Markdown under `_docs_src/` is a copy of `docs/` from the node-efatura repo. `scripts/sync-docs.mjs`
transforms it into Astro content under `src/content/docs/`:

- adds frontmatter (`title` from the first `# ` heading, `sidebar.order` from the numeric prefix),
- removes the original `#` heading (the layout renders the title) and the manual prev/index/next footers,
- rewrites internal `*.md` links to site routes.

The generated `src/content/docs/` is committed so the site builds without the node-efatura repo present.

## Refreshing the docs

```sh
# replace the raw copy, then regenerate
cp -R /path/to/node-efatura/docs/. _docs_src/
bun run sync
```

To pull from a checkout elsewhere, set `EFATURA_DOCS`:

```sh
EFATURA_DOCS=/path/to/node-efatura/docs bun run sync
```

## Local development

```sh
bun install
bun run dev      # http://localhost:4321
bun run build    # static output in dist/
```

## Deployment

Deployed on Vercel as a static Astro build (`bun run build`, output `dist/`). Pushing to `main`
triggers a redeploy through the Vercel Git integration.
