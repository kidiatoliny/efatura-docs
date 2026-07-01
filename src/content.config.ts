import { defineCollection, z } from 'astro:content';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, posix, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const docsSourceUrl = new URL('../_docs_src/', import.meta.url);

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function routeFor(relPath: string): string {
  return `/${relPath.replace(/\.md$/, '')}/`;
}

function rewriteLinks(body: string, fileRelPath: string): string {
  return body.replace(/\]\(([^)]+?\.md)(#[^)]*)?\)/g, (_match, target: string, anchor = '') => {
    if (/^https?:|^\//.test(target)) {
      return `](${target}${anchor})`;
    }

    const resolved = posix.normalize(posix.join(posix.dirname(fileRelPath), target));
    return `](${routeFor(resolved)}${anchor})`;
  });
}

function stripNavFooter(lines: string[]): string[] {
  for (let index = lines.length - 1; index >= 0; index--) {
    if (lines[index].trim() !== '---') {
      continue;
    }

    const rest = lines.slice(index + 1).join('\n');

    if (/\]\(/.test(rest) && /\b(Index|Next|Previous)\b/.test(rest)) {
      return lines.slice(0, index);
    }

    break;
  }

  return lines;
}

function extractTitle(lines: string[]): { title: string | null; index: number } {
  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/^#\s+(.+?)\s*$/);

    if (match) {
      return { title: match[1].replace(/`/g, ''), index };
    }
  }

  return { title: null, index: -1 };
}

function extractDescription(body: string): string {
  const block: string[] = [];
  let inCode = false;

  for (const line of body.split('\n')) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      continue;
    }

    if (block.length === 0) {
      const isBlockMarker =
        trimmed === '' ||
        /^\s/.test(line) ||
        /^(#|>|\||[-*]\s|\d+\.\s)/.test(trimmed) ||
        trimmed.startsWith('<');

      if (isBlockMarker) {
        continue;
      }

      block.push(trimmed);
      continue;
    }

    if (trimmed === '') {
      break;
    }

    block.push(trimmed);
  }

  const text = block
    .join(' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length < 40) {
    return '';
  }

  if (text.length <= 160) {
    return text;
  }

  return `${text.slice(0, 157).replace(/\s+\S*$/, '').replace(/[.,;:\s]+$/, '')}...`;
}

export const collections = {
  docs: defineCollection({
    loader: {
      name: 'efatura-docs-source',
      load: async ({ config, generateDigest, parseData, renderMarkdown, store }) => {
        const sourceDir = fileURLToPath(docsSourceUrl);

        if (!existsSync(sourceDir)) {
          throw new Error(`source not found: ${sourceDir}`);
        }

        const currentIds = new Set<string>();
        const files = await walk(sourceDir);

        for (const filePath of files) {
          const relPath = relative(sourceDir, filePath).split(/[\\/]/).join('/');

          if (relPath === '00-index.md') {
            continue;
          }

          const raw = await readFile(filePath, 'utf8');
          const lines = stripNavFooter(raw.split('\n'));
          const { title, index } = extractTitle(lines);

          if (index >= 0) {
            lines.splice(index, 1);
          }

          const body = rewriteLinks(lines.join('\n').replace(/^\n+/, ''), relPath)
            .replace(/\[([^\]]+?)\.md\]\(/g, '[$1](')
            .trimEnd();
          const id = relPath.replace(/\.md$/, '');
          const data = {
            title: title ?? relPath,
            description: extractDescription(body) || undefined,
            sidebar: { order: Number(relPath.match(/(\d+)/)?.[1] ?? 999) },
          };
          const parsedData = await parseData({ id, data, filePath });
          const rendered = await renderMarkdown(body, { fileURL: pathToFileURL(filePath) });

          store.set({
            id,
            data: parsedData,
            body,
            filePath: relative(fileURLToPath(config.root), filePath).split(/[\\/]/).join('/'),
            digest: generateDigest(raw),
            rendered,
          });
          currentIds.add(id);
        }

        for (const id of store.keys()) {
          if (!currentIds.has(id)) {
            store.delete(id);
          }
        }
      },
    },
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      sidebar: z.object({ order: z.number().optional() }).optional(),
    }),
  }),
};
