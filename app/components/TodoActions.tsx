import { useFetcher, useFetchers } from '@remix-run/react';
import { FC } from 'react';
import { Item } from '~/types';

interface Props {
  tasks: Item[];
}

export const TodoActions: FC<Props> = ({ tasks }) => {
  const fetchers = useFetchers();
  const fetcher = useFetcher();

  const isClearingCompleted =
    fetcher.state === 'submitting' &&
    fetcher.formData?.get('intent') === 'clear completed';

  const isDeletingAll =
    fetcher.state === 'submitting' &&
    fetcher.formData?.get('intent') === 'delete all';

  const isTogglingCompletion = fetchers.some(
    (fetcher) =>
      fetcher.state !== 'idle' &&
      fetcher.formData?.get('intent') === 'toggle completion'
  );

  const isDeleting = fetchers.some(
    (fetcher) =>
      fetcher.state !== 'idle' &&
      fetcher.formData?.get('intent') === 'delete task'
  );

  const completingTodoIds = fetchers
    .filter(
      (fetcher) =>
        fetcher.state !== 'idle' &&
        fetcher.formData?.get('intent') === 'toggle completion'
    )
    .map((fetcher) => ({
      id: fetcher.formData?.get('id'),
      isCompleted: fetcher.formData?.get('isCompleted'),
    }));

  const deletingTodoIds = fetchers
    .filter(
      (fetcher) =>
        fetcher.state !== 'idle' &&
        fetcher.formData?.get('intent') === 'delete task'
    )
    .map((fetcher) => fetcher.formData?.get('id'));

  tasks = isTogglingCompletion
    ? tasks.map((task) => {
        const completingTodo = completingTodoIds.find(
          (todo) => todo.id === task.id
        );
        if (completingTodo) {
          task.isCompleted = !JSON.parse(completingTodo.isCompleted as string);
        }
        return task;
      })
    : tasks;

  tasks = isDeleting
    ? tasks.filter((task) => !deletingTodoIds.includes(task.id))
    : tasks;

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <p className="text-center leading-7">
        {tasks.length} {tasks.length === 1 ? 'item' : 'items'} left
      </p>
      <fetcher.Form
        method="post"
        className="flex items-center gap-4"
        onSubmit={(event) => {
          const submitter = (event.nativeEvent as SubmitEvent)
            .submitter as HTMLButtonElement;

          if (
            submitter.value === 'clear completed' &&
            !confirm('Are you sure you want to clear all completed tasks?')
          ) {
            event.preventDefault();
            return;
          } else if (
            submitter.value === 'delete all' &&
            !confirm('Are you sure you want to delete all tasks?')
          ) {
            event.preventDefault();
            return;
          }
        }}
      >
        <button
          disabled={
            !tasks.some((todo) => todo.isCompleted) || isClearingCompleted
          }
          name="intent"
          value="clear completed"
          className="text-red-400 transition hover:text-red-600 disabled:pointer-events-none disabled:opacity-25"
        >
          {isClearingCompleted ? 'Clearing...' : 'Clear Completed'}
        </button>
        <button
          disabled={tasks.length === 0 || isDeletingAll}
          name="intent"
          value="delete all"
          className="text-red-400 transition hover:text-red-600 disabled:pointer-events-none disabled:opacity-25"
        >
          {isDeletingAll ? 'Deleting...' : 'Delete All'}
        </button>
      </fetcher.Form>
    </div>
  );
};
