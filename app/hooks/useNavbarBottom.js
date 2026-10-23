'use client';

import { useLayoutEffect, useState } from 'react';

// Bottom edge of the sticky Navbar (z-50), in px — re-measured on resize.
// Things pinned under it (the combat drawer, the sticky initiative bar) use
// it as their `top` instead of a hard-coded navbar height.
export default function useNavbarBottom() {
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    const measure = () => setTop(Math.max(0, document.querySelector('nav')?.getBoundingClientRect().bottom || 0));
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return top;
}
