import type { Item, TodoActions } from '~/types';

const items: Item[] = [];

export const todos: TodoActions = {
  async create(description: string) {
    const createdTodo: Item = {
      id: Math.random().toString(16).slice(2),
      description,
      isCompleted: false,
      createdAt: new Date(),
    };

    items.push(createdTodo);

    return createdTodo;
  },

  async read() {
    return items;
  },

  async update(id: string, fields: Partial<Omit<Item, 'id' | 'createdAt'>>) {
    const itemIndex = items.findIndex((item) => item.id === id);

    if (itemIndex === -1) {
      return undefined;
    }

    const updatedTodo: Item = {
      ...items[itemIndex],
      ...fields,
      completedAt: fields.isCompleted ? fields.completedAt : undefined,
    };

    items[itemIndex] = updatedTodo;

    return updatedTodo;
  },

  async delete(id: string) {
    const itemIndex = items.findIndex((item) => item.id === id);

    if (itemIndex === -1) {
      return undefined;
    }

    const [deletedTodo] = items.splice(itemIndex, 1);

    return deletedTodo;
  },

  async clearCompleted() {
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].isCompleted) {
        items.splice(i, 1);
      }
    }

    return items;
  },

  async deleteAll() {
    items.length = 0;
    return items;
  },
};
