import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
import {
  Form,
  json,
  Link,
  redirect,
  useFetcher,
  useLoaderData,
  useSearchParams,
} from '@remix-run/react';
import { useEffect, useRef } from 'react';
import ProfileMenu from '~/components/ProfileMenu';
import { ThemeSwitcher } from '~/components/ThemeSwitcher';
import { TodoActions } from '~/components/TodoActions';
import { TodoList } from '~/components/TodoList';
import { getUser, todos } from '~/lib/db.server';
import { getSession } from '~/sessions.server';
import { Item, View } from '~/types';

export const meta: MetaFunction = () => {
  return [
    { title: 'Todo App' },
    {
      name: 'description',
      content: 'A minimalistic todo app built with Remix.',
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  // Validate the session to ensure a valid session ID is present.
  const session = await getSession(request.headers.get('Cookie'));
  if (!session.has('_id')) {
    throw redirect('/signin', {
      // Clear the cookie to handle cases where the session ID remains in the cookie
      // but is no longer valid in the database. Without this, `commitSession` will
      // continue calling `updateData` instead of `createData`, which updates the
      // database but doesn't set a new session ID in the cookie. Clearing the cookie
      // ensures `createData` runs on the next sign-in, creating a new session ID.
      headers: { 'Set-Cookie': '__session=; Max-Age=0' },
    });
  }

  const { error, data: user } = await getUser(session.get('_id') as string);
  if (error || !user) {
    throw redirect('/signin');
  }

  return json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    tasks: user.tasks,
  });
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = await getSession(request.headers.get('Cookie'));
  const formData = await request.formData();

  const userId = session.get('_id') as string;
  const { intent, ...values } = Object.fromEntries(formData);

  switch (intent) {
    case 'create task': {
      const { description } = values;
      await todos.create(userId, description as string);
      break;
    }
    case 'toggle completion': {
      const { id: todoId, isCompleted } = values;
      await todos.update(userId, todoId as string, {
        isCompleted: !JSON.parse(isCompleted as string),
        completedAt: isCompleted ? new Date() : undefined,
      });
      break;
    }
    case 'edit task': {
      const { id: todoId } = values;
      await todos.update(userId, todoId as string, { isEditing: true });
      break;
    }
    case 'save task': {
      const { id: todoId, description } = values;
      await todos.update(userId, todoId as string, {
        description: description as string,
        isEditing: false,
      });
      break;
    }
    case 'delete task': {
      const { id:todoId } = values;
      await todos.delete(userId,todoId as string);
      break;
    }
    case 'clear completed': {
      await todos.clearCompleted(userId);
      break;
    }
    case 'delete all': {
      await todos.deleteAll(userId);
      break;
    }
    default: {
      throw new Response('Unknown intent', { status: 400 });
    }
  }
  return { ok: true };
};

export default function Home() {
  const { tasks } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view') || 'all';
  const addFormRef = useRef<HTMLFormElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const isAdding =
    fetcher.state === 'submitting' &&
    fetcher.formData?.get('intent') === 'create task';

  useEffect(() => {
    if (!isAdding) {
      addFormRef.current?.reset();
      addInputRef.current?.focus();
    }
  }, [isAdding]);

  return (
    <div className="flex flex-1 flex-col md:mx-auto md:w-[720px]">
      <header className="mb-12 flex items-center justify-between">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          TODO
        </h1>
        <div className="flex items-center justify-center gap-2">
          <ThemeSwitcher />
          <ProfileMenu />
        </div>
      </header>

      <main className="flex-1 space-y-8">
        <fetcher.Form
          ref={addFormRef}
          method="post"
          className="rounded-full border border-gray-200 bg-white/90 shadow-md dark:border-gray-700 dark:bg-gray-900"
        >
          <fieldset
            disabled={isAdding}
            className="flex items-center gap-2 p-2 text-sm"
          >
            <input
              ref={addInputRef}
              type="text"
              name="description"
              placeholder="Create a new todo..."
              required
              className="flex-1 rounded-full border-2 border-gray-200 px-3 py-2 text-sm font-bold text-black dark:border-white/50"
            />
            <button
              name="intent"
              value="create task"
              className="rounded-full border-2 border-gray-200/50 bg-gradient-to-tl from-[#00fff0] to-[#0083fe] px-3 py-2 text-base font-black transition hover:scale-105 hover:border-gray-500 sm:px-6 dark:border-white/50 dark:from-[#8e0e00] dark:to-[#1f1c18] dark:hover:border-white"
            >
              {isAdding ? 'Adding...' : 'Add'}
            </button>
          </fieldset>
        </fetcher.Form>

        <div className="rounded-3xl border border-gray-200 bg-white/90 px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
          <TodoList todos={tasks as unknown as Item[]} view={view as View} />
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/90 px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
          <TodoActions tasks={tasks as unknown as Item[]} />
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/90 px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
          <Form className="flex items-center justify-center gap-12 text-sm">
            <button
              aria-label="View all tasks"
              name="view"
              value="all"
              className={`transition ${
                view === 'all' ? 'font-bold' : 'opacity-50 hover:opacity-100'
              }`}
            >
              All
            </button>
            <button
              aria-label="View active tasks"
              name="view"
              value="active"
              className={`transition ${
                view === 'active' ? 'font-bold' : 'opacity-50 hover:opacity-100'
              }`}
            >
              Active
            </button>
            <button
              aria-label="View completed"
              name="view"
              value="completed"
              className={`transition ${
                view === 'completed'
                  ? 'font-bold'
                  : 'opacity-50 hover:opacity-100'
              }`}
            >
              Completed
            </button>
          </Form>
        </div>
      </main>

      <footer className="mt-12">
        <p className="text-center text-sm leading-loose">
          Built by Udoh. The source code is available on{' '}
          <Link
            to="https://github.com/udohjeremiah/remix-todo-app"
            target="_blank"
            rel="noopener noreferrer"
            className="relative font-medium text-white after:absolute after:-bottom-0.5 after:left-0 after:h-[1px] after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full dark:text-blue-500 dark:after:bg-blue-500"
          >
            GitHub
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
