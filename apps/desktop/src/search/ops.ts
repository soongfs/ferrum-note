export function countMatches(source: string, query: string): number {
  if (!query) {
    return 0;
  }

  let from = 0;
  let count = 0;

  while (from <= source.length) {
    const index = source.indexOf(query, from);
    if (index === -1) {
      break;
    }
    count += 1;
    from = index + query.length;
  }

  return count;
}

export function replaceNext(source: string, query: string, replacement: string): string {
  if (!query) {
    return source;
  }

  const index = source.indexOf(query);
  if (index === -1) {
    return source;
  }

  return source.slice(0, index) + replacement + source.slice(index + query.length);
}

export function replaceAll(source: string, query: string, replacement: string): string {
  if (!query) {
    return source;
  }

  return source.split(query).join(replacement);
}
