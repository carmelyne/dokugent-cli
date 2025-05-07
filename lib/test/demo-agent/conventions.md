
# Conventions: Weather Dashboard Agent

## Naming Conventions

- Use `camelCase` for all internal variable names.
- Use `snake_case` for API response keys.
- The dashboard file must be named `dashboard.md`.

## Behavior Rules

- Only call the weather API once per execution.
- If the API returns an error, log it in `dashboard.log` and abort further actions.
- Never overwrite existing dashboard sections outside the "Current Weather" block.
- Log all actions with timestamps.

## Environment

- Assumes `WEATHER_API_KEY` is available in environment variables.
- Agent will default to `Manila` if no city is specified.
