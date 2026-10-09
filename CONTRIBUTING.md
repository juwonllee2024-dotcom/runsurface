# Contributing

Thanks for improving RunSurface.

## Before opening a pull request

```powershell
npm ci --ignore-scripts
npm run verify
```

## Detector changes

Every detector should:

1. state the trigger it maps;
2. cite a relative file and line;
3. add a small fixture;
4. include a test for the positive case;
5. include a false-positive or ignored-directory case when relevant; and
6. preserve the read-only, no-network contract.

Avoid broad regexes that label ordinary source text as executable. Prefer a known file format and an explicit trigger.

## Pull requests

Explain the user pain, the detector's boundary, and what the report looks like. Do not include real secrets, private URLs, or copied proprietary repository contents in fixtures.
