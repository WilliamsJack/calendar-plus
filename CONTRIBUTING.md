# Contributing

Thanks for your interest in Calendar Plus. Bug reports, feature requests, and focused pull requests are welcome.

## Reporting bugs

Please open a GitHub issue and include as much of the following as you can:

- Obsidian version
- Calendar Plus version
- operating system
- theme and CSS snippets, especially for visual issues
- steps to reproduce the issue
- what you expected to happen
- what actually happened
- screenshots or screen recordings, if helpful

## Feature requests

Feature requests are welcome. Please describe the use case, not just the proposed solution. Calendar Plus aims to stay focused, lightweight, and close to Obsidian's native plugin conventions.

## Pull requests

Small, focused pull requests are welcome. For larger changes, please open an issue first so the approach can be discussed.

Before opening a pull request:

- Run `npm run build`
- Keep changes focused and easy to review
- Avoid broad CSS overrides
- Avoid `!important`
- Do not reintroduce `.view-content` padding, margin, width, or spacing overrides
- Preserve existing note-opening behavior unless the change has been discussed
- Follow existing patterns for settings, defaults, and persisted options

Calendar Plus is intentionally conservative about styling and behavior so it remains reliable across Obsidian themes and plugin review checks.
