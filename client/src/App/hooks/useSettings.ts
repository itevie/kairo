export default function useSettings() {
  return {
    useMoodColors:
      (localStorage.getItem("kairo-use-mood-colors") ?? "true") === "true",
    promptMood:
      (localStorage.getItem("kairo-prompt-mood") ?? "false") === "true",
  } as const;
}
