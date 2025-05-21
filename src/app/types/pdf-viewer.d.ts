/**
 * Type declaration file to fix PDF.js library TypeScript errors
 */

// Fix for SetIterator error
interface SetIterator<T> extends Iterator<T> {
  next(value?: any): IteratorResult<T>;
}
