import type { Item, View } from '~/types';

import { TodoItem } from '~/components/TodoItem';
import { FC, useMemo } from 'react';
import { useFetchers } from '@remix-run/react';

interface Props {
  todos: Item[];
  view: View;
}

export const TodoList: FC<Props> = ({ todos, view }) => {
  const fetchers = useFetchers();

  const isDeleting = fetchers.some(
    (fetcher) =>
      fetcher.state !== 'idle' &&
      fetcher.formData?.get('intent') === 'delete task'
  );

  const deletingTodoIds = fetchers
    .filter(
      (fetcher) =>
        fetcher.state !== 'idle' &&
        fetcher.formData?.get('intent') === 'delete task'
    )
    .map((fetcher) => fetcher.formData?.get('id'));

  const visibleTodos = useMemo(() => {
    let filteredTodos = todos.filter((todo) =>
      view === 'active'
        ? !todo.isCompleted
        : view === 'completed'
        ? todo.isCompleted
        : true
    );

    if (isDeleting) {
      filteredTodos = filteredTodos.filter(
        (todo) => !deletingTodoIds.includes(todo.id)
      );
    }

    return filteredTodos;
  }, [todos, view, isDeleting, deletingTodoIds]);

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
