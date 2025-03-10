import { ActionFunctionArgs, MetaFunction } from '@remix-run/node';
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
} from '@remix-run/react';
import { useState } from 'react';

import EyeIcon from '~/components/icons/EyeIcon';
import EyeOffIcon from '~/components/icons/EyeOffIcon';
import LoaderIcon from '~/components/icons/LoaderIcon';
import { createUser } from '~/lib/db.server';
import { validateForm } from '~/lib/utils';

export const meta: MetaFunction = () => {
  return [
    { title: 'Sign Up | Todo App' },
    {
      name: 'description',
      content: 'Create an account to manage your tasks efficiently.',
    },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const formError = validateForm({ name, email, password });
  if (formError) {
    return { errors: formError };
  }

  const { error } = await createUser(name, email, password);
  if (error) {
    return { errors: { result: error } };
  }

  return redirect('/signin');
}

export default function Signup() {
  const actionData = useActionData<typeof action>();
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const isSubmitting = navigation.formAction === '/signup';
  const errors = isSubmitting ? {} : actionData?.errors;

  return (
    <div className="flex flex-1 items-center justify-center p-6 md:mx-auto md:w-[720px] lg:p-20">
      <div className="w-full flex-col space-y-4 rounded-3xl border border-gray-200 bg-white/90 p-8 dark:border-gray-700 dark:bg-gray-900">
        <header>
          <h1 className="text-xl font-extrabold tracking-tight md:text-2xl">
            Sign up
          </h1>
        </header>
        <main>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/signin"
              className="relative text-sm font-medium text-blue-500 after:absolute after:-bottom-0.5 after:left-0 after:h-[1px] after:w-0 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full"
            >
              Sign in
            </Link>
          </p>
          <Form method="post">
            <fieldset disabled={isSubmitting} className="mt-6 space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  required
                  minLength={2}
                  className="flex h-9 w-full rounded-3xl border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm disabled:pointer-events-none disabled:opacity-25 dark:border-white/50"
                />
                {errors?.name && (
                  <p className="flex items-center text-sm font-medium leading-5 text-red-500">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  autoComplete="email"
                  inputMode="email"
                  required
                  className="flex h-9 w-full rounded-3xl border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm disabled:pointer-events-none disabled:opacity-25 dark:border-white/50"
                />
                {errors?.email && (
                  <p className="flex items-center text-sm font-medium leading-5 text-red-500">
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="flex h-9 w-full rounded-3xl border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm disabled:pointer-events-none disabled:opacity-25 dark:border-white/50"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-[5px] text-gray-200 transition-colors hover:text-black/50 disabled:opacity-50 dark:text-white/50 dark:hover:text-white"
                    onClick={() =>
                      setShowPassword((prevPassword) => !prevPassword)
                    }
                  >
                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
                <div className="flex justify-end gap-4">
                  <Link
                    to="/forgot-password"
                    className="relative text-sm font-medium text-blue-500 after:absolute after:-bottom-0.5 after:left-0 after:h-[1px] after:w-0 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full"
                  >
                    Forgot password?
                  </Link>
                </div>
                {errors?.password && (
                  <p className="flex items-center text-sm font-medium leading-5 text-red-500">
                    {errors.password}
                  </p>
                )}
              </div>
              <button className="flex h-9 w-full items-center justify-center rounded-full border-2 border-gray-200/50 bg-gradient-to-tl from-[#00fff0] to-[#0083fe] px-4 py-2 text-sm font-medium shadow transition hover:border-gray-500 disabled:pointer-events-none disabled:opacity-50 dark:border-white/50 dark:from-[#8e0e00] dark:to-[#1f1c18] dark:hover:border-white">
                {isSubmitting ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    Signing up
                  </>
                ) : (
                  'Sign up'
                )}
              </button>
            </fieldset>
            {errors?.result && (
              <output className="mt-6 block text-center text-sm font-medium leading-5 text-red-500">
                {errors.result}
              </output>
            )}
          </Form>
        </main>
      </div>
    </div>
  );
}
