# efatura-docs

Documentation site for [@akira-io/efatura](https://github.com/akira-io/node-efatura), built with
[Astro](https://astro.build). The site mirrors the `docs/` tree of the node-efatura repository.

## How the mirror works

The Markdown under `_docs_src/` is updated by the node-efatura repository. This site reads that
tree directly during Astro content loading:

- derives metadata (`title` from the first `# ` heading, `sidebar.order` from the numeric prefix),
- removes the original `#` heading (the layout renders the title) and the manual previous, index, and next footers,
- rewrites internal `*.md` links to site routes.

## Local development

```sh
bun install
bun run dev      # http://localhost:4321
bun run build    # static output in dist/
```

## Deployment

Deployed on Vercel as a static Astro build (`bun run build`, output `dist/`). Pushing to `main`
triggers a redeploy through the Vercel Git integration.
