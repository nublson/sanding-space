export { INTRODUCTION } from "./standalone";

import { INTRODUCTION, standalonePageId } from "./standalone";

export function introductionPageId(
  env: Record<string, string | undefined> = process.env,
): string {
  return standalonePageId(INTRODUCTION, env);
}
