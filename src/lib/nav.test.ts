import { describe, expect, it } from 'bun:test';
import { buildNav } from './nav';

describe('buildNav', () => {
  it('places examples after reference', () => {
    const nav = buildNav([
      { id: '10-architecture', data: { title: 'Architecture', sidebar: { order: 10 } } },
      { id: 'examples/fastify/server', data: { title: 'Fastify Server', sidebar: { order: 1 } } },
    ]);

    expect(nav.map((group) => group.label)).toEqual(['Reference', 'Examples']);
  });

  it('adds nested documents to automatic sidebar groups', () => {
    const nav = buildNav([
      { id: '01-installation', data: { title: 'Installation', sidebar: { order: 1 } } },
      { id: '03-quick-start', data: { title: 'Quick Start', sidebar: { order: 3 } } },
      { id: 'examples/fastify/react', data: { title: 'React Example', sidebar: { order: 1 } } },
      { id: 'examples/express/server', data: { title: 'Express Server', sidebar: { order: 1 } } },
      { id: 'recipes/01-batch-submit', data: { title: 'Batch Submit', sidebar: { order: 1 } } },
    ]);

    expect(nav).toContainEqual({
      label: 'Examples',
      items: [
        {
          id: 'examples/fastify',
          title: 'Fastify',
          items: [{ id: 'examples/fastify/react', title: 'React', href: '/examples/fastify/react' }],
        },
        {
          id: 'examples/express',
          title: 'Express',
          items: [{ id: 'examples/express/server', title: 'Server', href: '/examples/express/server' }],
        },
      ],
    });
    expect(nav).toContainEqual({
      label: 'Recipes',
      items: [{ id: 'recipes/01-batch-submit', title: 'Batch Submit', href: '/recipes/01-batch-submit' }],
    });
  });
});
