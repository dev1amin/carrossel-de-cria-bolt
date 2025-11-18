import { formatDistanceToNow } from 'date-fns';

/**
 * Format a number for display (e.g., 1200 -> 1.2k)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Format a timestamp to a relative time string (e.g., "2 days ago")
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format time ago for posts (alias for formatTimestamp)
 */
export function formatTimeAgo(timestamp: number): string {
  try {
    // Check if timestamp is in seconds or milliseconds
    // If timestamp > 1e10, it's likely in milliseconds, otherwise in seconds
    const isMilliseconds = timestamp > 1e10;
    const timestampMs = isMilliseconds ? timestamp : timestamp * 1000;
    
    const date = new Date(timestampMs);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp for formatTimeAgo:', timestamp);
      return 'Data inválida';
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting time ago:', error, timestamp);
    return 'Erro na data';
  }
}

/**
 * Format post text to display hashtags in a special style
 */
export function formatPostText(text: string): { parts: Array<{ text: string; isHashtag: boolean }> } {
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  const parts: Array<{ text: string; isHashtag: boolean }> = [];
  
  let lastIndex = 0;
  let match;
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    // Add the text before the hashtag
    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        isHashtag: false,
      });
    }
    
    // Add the hashtag
    parts.push({
      text: match[0],
      isHashtag: true,
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      isHashtag: false,
    });
  }
  
  return { parts };
}

/**
 * Get the number of days ago a post was published
 */
export function getDaysAgo(timestamp: number): number {
  try {
    // Check if timestamp is in seconds or milliseconds
    const isMilliseconds = timestamp > 1e10;
    const timestampMs = isMilliseconds ? timestamp : timestamp * 1000;
    
    const postDate = new Date(timestampMs);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - postDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error calculating days ago:', error, timestamp);
    return 0;
  }
}

/**
 * Check if a post is older than 15 days
 */
export function isPostOld(timestamp: number): boolean {
  return getDaysAgo(timestamp) > 15;
}