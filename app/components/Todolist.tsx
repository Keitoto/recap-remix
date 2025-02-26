import type { Item, View } from '~/types';

import { TodoItem } from '~/components/TodoItem';
import { FC, useMemo } from 'react';

interface Props {
  todos: Item[];
  view: View;
}

export const TodoList: FC<Props> = ({ todos, view }) => {
  const visibleTodos = useMemo(
    () =>
      todos.filter((todo) =>
        view === 'active'
          ? !todo.isCompleted
          : view === 'completed'
          ? todo.isCompleted
          : true
      ),
    [todos, view]
  );

  if (visibleTodos.length === 0) {
    return (
      <p className="text-center leading-7">
        {view === 'all'
          ? 'No tasks available'
          : view === 'active'
          ? 'No active tasks'
          : 'No completed tasks'}
      </p>
    );
  }

  return (
    <ul>
      {visibleTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
};
