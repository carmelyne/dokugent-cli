
# Compiled Spec: Weather Dashboard Agent

## Input Parameters

- City: dynamic (provided at runtime or defaults to `Manila`)
- WEATHER_API_KEY: required, from environment

## Execution Plan

1. Read input for city name.
2. Fetch current weather data via HTTP GET:
   - Endpoint: `https://api.weather.example.com/current`
   - Params: `city`, `apikey`
3. Parse response:
   - Extract temperature, condition, humidity
4. Format output:
   - Markdown snippet under "Current Weather"
5. Insert snippet into `dashboard.md` (replace old block)
6. Log result in `dashboard.log` with timestamp

## Safeguards

- Log error if API fails or response is incomplete
- Abort if `dashboard.md` is missing
- Do not modify other dashboard sections

## Output Files

- `dashboard.md`
- `dashboard.log`
