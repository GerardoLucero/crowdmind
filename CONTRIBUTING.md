# Contributing to Crowdmind

Crowdmind is maintained by a single author. Contributions are welcome in limited scope.

## What is accepted

- **Bug reports** — open an issue describing the problem, steps to reproduce, and expected behavior
- **Documentation improvements** — typos, unclear sections, missing examples
- **New population presets** — well-defined professional profiles with clear role, experience, industry, and bias fields
- **Bug fixes** — with a clear description of what was broken and how the fix addresses it

## What is not accepted

- Feature additions that change the core simulation pipeline
- UI redesigns or style changes
- Dependency upgrades without a clear reason
- Refactors that do not fix a demonstrated problem

## Process

1. Open an issue before starting any work
2. Wait for acknowledgement before writing code
3. Keep pull requests small and focused — one concern per PR
4. All changes require a clear description of the problem being solved

## Code style

- TypeScript strict mode
- No external dependencies unless strictly necessary
- No client-side state management libraries — React built-ins only
- Prisma for all database access

## Questions

Open an issue with the `question` label.
