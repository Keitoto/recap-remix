import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';

import './tailwind.css';
import { LoaderFunctionArgs } from '@remix-run/node';
import { parseTheme } from '~/lib/theme-cookie.server';
import { ThemeScript, useTheme } from '~/components/ThemeScript';

export async function loader({ request }: LoaderFunctionArgs) {
  const theme = await parseTheme(request);

  return Response.json({ theme }, { headers: { Vary: 'Cookie' } });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useTheme() === 'dark' ? 'dark' : '';
  return (
    <html
      lang="en"
      className={`bg-white/90 font-system antialiased dark:bg-gray-900 ${theme}`}
    >
      <head>
        <ThemeScript />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-screen max-w-[100vw] flex-col overflow-x-hidden bg-gradient-to-r from-[#00fff0] to-[#0083fe] px-4 py-8 text-black dark:from-[#8E0E00] dark:to-[#1F1C18] dark:text-white">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-center text-4xl font-extrabold tracking-tight lg:text-5xl">
        Oops, an error occurred!
      </h1>
      <Link
        to="."
        replace
        className="inline-flex justify-center rounded-full border border-gray-200 bg-gray-50 px-8 py-4 text-xl font-medium hover:border-gray-500 dark:border-gray-700 dark:bg-gray-900"
      >
        Try again
      </Link>
    </div>
  );
}

export default function App() {
  return <Outlet />;
}
