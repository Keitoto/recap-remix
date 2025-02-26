export interface Item {
  id: string;
  description: string;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
  isEditing?: boolean;
}

export interface TodoActions {
  create: (description: string) => Promise<Item>;
  read: () => Promise<Item[]>;
  update: (
    id: string,
    fields: Partial<Omit<Item, 'id' | 'createdAd'>>
  ) => Promise<Item | undefined>;
  delete: (id: string) => Promise<Item | undefined>;
  clearCompleted: () => Promise<Item[]>;
  deleteAll: () => Promise<Item[]>;
}

export type View = "all" | "active" | "completed";