export const ContentHashSet = new Set<string>();

export function generateContentHash(content: string): string {
  // Simple hash function for content deduplication
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

export function isDuplicateContent(content: string): boolean {
  const normalized = content.trim().toLowerCase().replace(/\s+/g, ' ');
  const hash = generateContentHash(normalized);
  
  if (ContentHashSet.has(hash)) {
    return true;
  }
  
  ContentHashSet.add(hash);
  return false;
}

export function clearContentCache(): void {
  ContentHashSet.clear();
}