import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildNav } from '@/lib/nav';

export const GET: APIRoute = async ({ site }) => {
  const base = site?.href.replace(/\/$/, '') ?? 'https://efatura.akira-io.com';
  const docs = await getCollection('docs');
  const nav = buildNav(docs);
  const descriptions = new Map(docs.map((doc) => [doc.id, doc.data.description]));

  const sections = nav
    .map((group) => {
      const items = group.items
        .map((item) => {
          const description = descriptions.get(item.id);
          return `- [${item.title}](${base}${item.href})${description ? `: ${description}` : ''}`;
        })
        .join('\n');
      return `## ${group.label}\n\n${items}`;
    })
    .join('\n\n');

  const body = `# efatura

> Framework-agnostic Node.js engine for Cabo Verde e-Fatura fiscal documents. The core builds DFE documents, generates official v11 XML, signs with XAdES-BES, packages ZIP payloads, and checks DNRE fiscal readiness, with Express, Fastify, and Nest adapters over shared HTTP routes.

${sections}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
