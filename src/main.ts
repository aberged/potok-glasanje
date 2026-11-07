import { mountBoard } from './ui';

if (import.meta.env.DEV) {
  const { seedDevPolls } = await import('./dev-tools');
  const { installDevPotok } = await import('./potok-dev');
  seedDevPolls();
  installDevPotok();
}

// No top-level await below this point: the build wrapper (vite.config.ts) runs
// this code inside a plain function.

mountBoard(document.querySelector<HTMLElement>('#polls')!);
