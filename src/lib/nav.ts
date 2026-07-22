export interface DocEntryLike {
  id: string;
  data: { title: string; sidebar?: { order?: number } };
}

export interface NavItem {
  id: string;
  title: string;
  href?: string;
  items?: NavItem[];
}

export interface NavLeafItem extends NavItem {
  href: string;
  items?: never;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

function orderOf(entry: DocEntryLike): number {
  if (typeof entry.data.sidebar?.order === 'number') return entry.data.sidebar.order;
  const match = entry.id.match(/(\d+)/);
  return match ? Number(match[1]) : 999;
}

function dirOf(id: string): string {
  return id.includes('/') ? id.split('/')[0] : '';
}

const ROOT_GROUPS: { label: string; match: (order: number) => boolean }[] = [
  { label: 'Start here', match: (order) => order <= 3 },
  { label: 'Guides', match: (order) => order >= 4 && order <= 8 },
  { label: 'Reference', match: (order) => order >= 10 },
];

function titleCase(value: string): string {
  return value
    .replace(/^\d+-/, '')
    .split('-')
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`)
    .join(' ');
}

function titleFromId(id: string): string {
  return titleCase(id.split('/').at(-1) ?? id);
}

function toNavItem(entry: DocEntryLike): NavLeafItem {
  return { id: entry.id, title: entry.data.title, href: `/${entry.id}` };
}

function toNestedNavItem(entry: DocEntryLike): NavLeafItem {
  return { id: entry.id, title: titleFromId(entry.id), href: `/${entry.id}` };
}

function buildNestedItems(entries: DocEntryLike[], prefix: string): NavItem[] {
  const directItems = entries
    .filter((entry) => entry.id.split('/').length === prefix.split('/').length + 1)
    .map(toNestedNavItem);
  const childDirs = [
    ...new Set(
      entries
        .map((entry) => entry.id.slice(prefix.length + 1).split('/'))
        .filter((parts) => parts.length > 1)
        .map((parts) => parts[0]),
    ),
  ];
  const childItems = childDirs.map((childDir) => {
    const id = `${prefix}/${childDir}`;
    return {
      id,
      title: titleCase(childDir),
      items: buildNestedItems(
        entries.filter((entry) => entry.id.startsWith(`${id}/`)),
        id,
      ),
    };
  });

  return [...directItems, ...childItems];
}

export function buildNav(entries: DocEntryLike[]): NavGroup[] {
  const sorted = [...entries].sort((a, b) => orderOf(a) - orderOf(b));
  const rootEntries = sorted.filter((entry) => dirOf(entry.id) === '');
  const nestedDirs = [...new Set(sorted.map((entry) => dirOf(entry.id)).filter(Boolean))];
  const rootGroups = ROOT_GROUPS.map((group) => ({
    label: group.label,
    items: rootEntries.filter((entry) => group.match(orderOf(entry))).map(toNavItem),
  }));
  const nestedGroups = nestedDirs.map((dir) => ({
    label: titleCase(dir),
    items: buildNestedItems(
      sorted.filter((entry) => dirOf(entry.id) === dir),
      dir,
    ),
  }));
  return [...rootGroups, ...nestedGroups].filter((group) => group.items.length > 0);
}

export function flattenNav(groups: NavGroup[]): NavLeafItem[] {
  return groups.flatMap((group) => flattenItems(group.items));
}

function flattenItems(items: NavItem[]): NavLeafItem[] {
  return items.flatMap((item) => (item.items?.length ? flattenItems(item.items) : [item as NavLeafItem]));
}
