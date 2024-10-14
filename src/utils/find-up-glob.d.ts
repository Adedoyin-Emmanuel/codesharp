declare module "find-up-glob" {
  function sync(glob: string, opts: { cwd?: string }): string[];
}
