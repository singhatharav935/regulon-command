'use client';

import { useState } from 'react';

export function usePrice() {
  const [price, setPrice] = useState<number>(118);

  return {
    price,
    setPrice,
  };
}
