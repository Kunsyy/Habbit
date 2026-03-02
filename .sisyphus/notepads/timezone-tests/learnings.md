## Timezone Testing
- Successfully set up Vitest with Bun for timezone-aware testing.
- Validated `getTodayDateStr` across multiple timezones (New York, Tokyo, London, UTC) using `vi.useFakeTimers` and `vi.setSystemTime`.
- Confirmed that midnight transitions and leap years (2024-02-29) are handled correctly by `Intl.DateTimeFormat`.
