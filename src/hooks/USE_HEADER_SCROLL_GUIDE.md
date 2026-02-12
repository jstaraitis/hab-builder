# useHeaderScroll Hook - How to Use

## Overview
The `useHeaderScroll` hook enables collapsing headers across any page. Headers automatically hide when scrolling down and reappear when scrolling up.

## Basic Usage

### For Pages with Full-Height Scroll Containers

```tsx
import { useHeaderScroll } from '../../hooks/useHeaderScroll';

export function MyPage() {
  const { isVisible, scrollRef } = useHeaderScroll();

  return (
    <div 
      ref={scrollRef}
      className="h-screen overflow-y-auto space-y-4"
    >
      {/* Header - Hidden/shown based on scroll */}
      <div className={`sticky top-0 z-10 bg-white dark:bg-gray-800 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <h1>My Page Title</h1>
      </div>

      {/* Rest of content */}
      <div>
        ...
      </div>
    </div>
  );
}
```

### For Window/Document Scrolling (No scrollRef)

```tsx
import { useHeaderScroll } from '../../hooks/useHeaderScroll';

export function MyPage() {
  const { isVisible } = useHeaderScroll(); // Don't use scrollRef

  return (
    <div className="space-y-4">
      {/* Header will track window scroll */}
      <header className={`sticky top-0 z-10 transition-all duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <h1>My Page Title</h1>
      </header>

      {/* Content */}
      <div>
        ...
      </div>
    </div>
  );
}
```

## Options

```tsx
const { isVisible, scrollRef } = useHeaderScroll({
  threshold: 50,    // Distance from top before header can hide (px). Default: 50
  hideDelay: 0      // Delay before hiding while scrolling (ms). Default: 0
});
```

## Key Points

1. **Always attach the ref**: Add `ref={scrollRef}` to your scrollable container (the one with `overflow-y-auto`)
2. **Use conditional classes**: Use `isVisible` to control `translate-y-0` vs `-translate-y-full`
3. **Multiple containers**: If your page has multiple independent scrollable areas, use the hook multiple times with different refs
4. **No horizontal scrolling**: Hook only tracks vertical scroll

## Example: Applying to All Pages

Just add to the top of your page component:

```tsx
const { isVisible, scrollRef } = useHeaderScroll();
```

Then wrap your scrollable container with the ref and apply the conditional visibility classes. Done!
