"use client";

import { useCallback, useEffect, useState } from "react";

interface WithId {
  id: string;
}

export function useCollection<T extends WithId>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch(endpoint);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [endpoint]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(endpoint);
      const json = await res.json();
      if (!cancelled) {
        setData(json);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  const addItem = useCallback(
    async (item: Omit<T, "id">) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const created = (await res.json()) as T;
      setData((prev) => [...prev, created]);
      return created;
    },
    [endpoint]
  );

  const updateItem = useCallback(
    async (item: T) => {
      setData((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      return item;
    },
    [endpoint]
  );

  const removeItem = useCallback(
    async (id: string) => {
      await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
      setData((prev) => prev.filter((i) => i.id !== id));
    },
    [endpoint]
  );

  return { data, loading, addItem, updateItem, removeItem, refresh, setData };
}
