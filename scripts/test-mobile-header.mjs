import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const header = await readFile(new URL('../src/components/Header.astro', import.meta.url), 'utf8');
const search = await readFile(new URL('../src/components/Search.tsx', import.meta.url), 'utf8');

assert.match(header, /h-14.*sm:h-16/s);
assert.match(header, /px-3.*sm:px-6/s);
assert.match(header, /hidden.*sm:inline-flex/s);
assert.match(header, /hidden.*md:inline-flex/s);
assert.match(header, /Beta documentation\./);
assert.match(header, /APIs may change before/);
assert.match(search, /w-9.*md:w-64/s);
assert.match(search, /hidden.*md:block/s);
assert.match(search, /hidden.*md:inline/s);
