# AI Agent Rules (Short)

This file summarizes only AI-agent operating rules for this repository.
It intentionally excludes architecture, product requirements, and feature design.

## 1. Mandatory Context Loading

- Read applicable instruction files before starting work.
- If a skill applies, load its SKILL.md first, then proceed.
- For Azure-specific requests, load Azure instruction context first.

## 2. Postman Script Modes (applyTo)

- `**/*-pre-*-pm-*`: pre-request mode.
  - Never use `pm.response`.
  - Never write tests here.
  - Only request preparation logic.
- `**/*-post-*-pm-*`: post-response mode.
  - Use `pm.response`, `pm.test`, `pm.expect`.
  - Keep assertions inside test callbacks.

## 3. Safe Editing Rules

- Make minimal, scoped changes.
- Do not revert unrelated local changes.
- Avoid destructive git commands.
- Keep code and docs aligned with existing project conventions.

## 4. Security-Sensitive Behavior

- Never expose secrets, tokens, or PII in outputs.
- Validate auth/security changes with tests.
- Prefer explicit configuration over silent fallbacks in security-critical paths.

## 5. Test and Quality Gate

- Run relevant tests for every behavior/security change.
- Do not leave failing tests after edits.
- Keep strict TypeScript and lint expectations in mind.

## 6. Git and Commit Rules

- Use Conventional Commits.
- Keep commits atomic and small.
- Ensure each commit is buildable and testable.

## 7. Coding Best Practices

- Keep files small (target <=100 lines when possible).
- Use clear, descriptive names for variables, functions, and types.
- Keep functions short and focused on one responsibility.
- Prefer reusable abstractions instead of copy-paste logic.
- Minimize technical debt: avoid quick fixes that break maintainability.
- Validate behavior with tests when changing logic.
- Keep complexity low (guard clauses, simple control flow).
- Respect strict typing and avoid implicit any patterns.

## 8. Quick Agent Checklist

- Instructions loaded?
- Skill loaded (if applicable)?
- Scope and safety respected?
- Relevant tests passed?
- No secret leakage in responses?
