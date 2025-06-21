# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.2.0](https://github.com/carmelyne/dokugent-cli/compare/v1.1.2...v1.2.0) (2025-06-21)


### Features

* add memory command, restructure NVIDIA presets, and update plan/criteria wizardsfeat: add memory command, restructure NVIDIA presets, and update plan/criteria wizards ([382a419](https://github.com/carmelyne/dokugent-cli/commit/382a419c0cada22d9226e35ffb5fac052ae9af7b))

### [1.1.2](https://github.com/carmelyne/dokugent-cli/compare/v1.1.1...v1.1.2) (2025-06-12)

### [1.1.1](https://github.com/carmelyne/dokugent-cli/compare/v1.1.0...v1.1.1) (2025-06-09)

## [1.1.0](https://github.com/carmelyne/dokugent-cli/compare/v1.0.0...v1.1.0) (2025-06-08)


### Features

* add timestamp + token metadata to plan, criteria, conventions, and preview ([29717f2](https://github.com/carmelyne/dokugent-cli/commit/29717f2fc9279333bbab948ce3402f0e833553cd))

## 1.0.0 (2025-06-07)


### Features

* **agent:** add --ls and --use with current/latest display and switching ([6e4fe81](https://github.com/carmelyne/dokugent-cli/commit/6e4fe81551f89885c6c80bd942c584d1b93168ea))
* **agent:** add --show --edit --check flags and identity validation framework ([d22da3b](https://github.com/carmelyne/dokugent-cli/commit/d22da3bb0738fce1f6dda47b891eb37f21efb13b))
* **agent:** add --t flag for sample identity generation and name sync warning ([99f9087](https://github.com/carmelyne/dokugent-cli/commit/99f90878b41bdbc770db077a21ffdd028cef6f1f))
* **agent:** display estimated agent profile token count ([dff5981](https://github.com/carmelyne/dokugent-cli/commit/dff598173c0f03b248e4f3a53638471964dbc0f0))
* **agent:** ecosystem scaffold, fallback fixes, and markdown preset support ([e92b894](https://github.com/carmelyne/dokugent-cli/commit/e92b894720286c4120800d02a48bfe2e9ef797aa))
* **byo:** add support for selecting raw BYO files and saving to agent-scoped path with overwrite prompt ([613272d](https://github.com/carmelyne/dokugent-cli/commit/613272d206028f8223f744dc696157bda49c1661))
* **certify:** rewrite certify command to include SHA tracking, validity prompts, and structured certified log paths ([0d2635b](https://github.com/carmelyne/dokugent-cli/commit/0d2635b73b875b864b9b4246d863a5172811765f))
* **conventions:** add scaffold wizard with agent profile selection and custom mode ([85f4565](https://github.com/carmelyne/dokugent-cli/commit/85f4565e2c2dafbc4d310c2f2228577935977be0))
* **conventions:** support --t <type> with auto-folder, symlink, and agentId-based versioning ([2e74ab6](https://github.com/carmelyne/dokugent-cli/commit/2e74ab6c9176010437de7253fd9968db79f641b6))
* **criteria, plan:** dedup criteria inputs + add token trace to plan output ([4f9b2c2](https://github.com/carmelyne/dokugent-cli/commit/4f9b2c2e327fcf063d5b04a66e94af23510598eb))
* **criteria:** add criteria wizard with versioned output and symlink ([7367a48](https://github.com/carmelyne/dokugent-cli/commit/7367a48f14a27161f303b98be5e33d2b9aad9c96))
* **criteria:** add trace and template commands for markdown-based agent evaluation ([45f3c64](https://github.com/carmelyne/dokugent-cli/commit/45f3c64dfebb4db88ca72d71033e5a0180444d8d))
* **criteria:** match plan.ts command structure and fix wizard fallback ([393a05f](https://github.com/carmelyne/dokugent-cli/commit/393a05f5668d113f480f7440cafff7349b44270f))
* **deploy:** add deploy command with wizard and flag support ([e3286dd](https://github.com/carmelyne/dokugent-cli/commit/e3286dd24a98d6ae12dc73a874f4e7d3d3818991))
* improve inspect, preview, and compile commands ([5cf4229](https://github.com/carmelyne/dokugent-cli/commit/5cf42295c015a46b664c962ba5e9aa9ba32334f6))
* **init:** add --yes flag for non-interactive agent scaffolding ([49096bd](https://github.com/carmelyne/dokugent-cli/commit/49096bd801257beaac5f24461695f0efd0a2f540))
* **init:** create blacklist.txt alongside whitelist.txt during init ([3fea3df](https://github.com/carmelyne/dokugent-cli/commit/3fea3df1e2f56e9f40608248f3597e95a2a363a3))
* **init:** scaffold TypeScript-based Dokugent CLI with modular agent structure ([91acb1c](https://github.com/carmelyne/dokugent-cli/commit/91acb1c5390d0d56d2a6c98b308b90c00ffd55b9))
* **keygen/owner:** refactor identity wizard, timestamp, and key metadata ([527ae6d](https://github.com/carmelyne/dokugent-cli/commit/527ae6d98bf6362558158403a048a87562945a58))
* **keygen:** add prompt, metadata file, and fingerprint to keygen command ([6809564](https://github.com/carmelyne/dokugent-cli/commit/68095642ab40285a72c77469d775b4aa3b43a6a2))
* **keygen:** finalize --show flag logic and cleanup unused flags ([252ddec](https://github.com/carmelyne/dokugent-cli/commit/252ddecedacc103d6c0b0426e439d01cd04708b0))
* **owner:** add VSCode edit support and CLI-safe args handling ([d38b3ac](https://github.com/carmelyne/dokugent-cli/commit/d38b3ac9f4f14d6ebfdb921e528cb1354e4865a3))
* **plan:** add plan wizard and symlinked versioned plan scaffolding ([d17e4a7](https://github.com/carmelyne/dokugent-cli/commit/d17e4a7b234e6f52fdbcedca1d455c5942490f96))
* **plan:** always launch plan wizard, show active steps, and normalize symlink output ([e115513](https://github.com/carmelyne/dokugent-cli/commit/e11551365b5c0672df9d554cfd1b90c6f1803647))
* **plan:** complete CLI support for plan commands ([d6593a2](https://github.com/carmelyne/dokugent-cli/commit/d6593a2879f17cca79a753c49e6168d1cf0dccf9))
* **plan:** complete doctor support for scrub, create-missing, rebuild-index ([aefe092](https://github.com/carmelyne/dokugent-cli/commit/aefe0927c6e82da5ad9a1026cbc3b1ff12038f64))
* **plan:** wizard now stores individual step files and assembles plan.md ([af80a90](https://github.com/carmelyne/dokugent-cli/commit/af80a905b7f7c3b9a3bee8afda08075807b5d433))
* **preview :** add preview log and report output with structured content ([6a2c1f4](https://github.com/carmelyne/dokugent-cli/commit/6a2c1f4803f392528bfc95efa1c19ff1c76a61db))
* **preview:** add token count estimate and write preview JSON to agent-named folder ([5064d67](https://github.com/carmelyne/dokugent-cli/commit/5064d679fe04aae32286e83208e82bda5166e8cc))
* **preview:** enhance preview output with per-agent JSON, token load summary ([4a3620e](https://github.com/carmelyne/dokugent-cli/commit/4a3620ef47bd445c125882339d8cb81a0ae480c3))
* **preview:** finalize preview command with token estimate, security scan, and symlink ([4e399ed](https://github.com/carmelyne/dokugent-cli/commit/4e399ed30ee508c3cdddd19e7a578c010a9a0cd2))
* **preview:** finalize timestamped output + symlink flow ([e69aa64](https://github.com/carmelyne/dokugent-cli/commit/e69aa6497b9785554bce4e9ac6cff1ee5da24e4b))
* **security:** add CLI-bound security scan with approval checks and override support ([87c9a21](https://github.com/carmelyne/dokugent-cli/commit/87c9a2117451cda7d936cd9272c3a780d2973edc))
* **security:** deep file scan with EISDIR guard + approval metadata checks ([fbd67be](https://github.com/carmelyne/dokugent-cli/commit/fbd67bebe43d81cfe34efaaacab17c59d1bc48a9))
* **simulate:** add --dry flag to skip memory write, support override constraints and custom llm ([40eda66](https://github.com/carmelyne/dokugent-cli/commit/40eda665c5eb73f895b06cc6c50d05c1b22e0ccc))
* **trace:** integrate simulate, MCP server, and full agent trace support ([666cd8b](https://github.com/carmelyne/dokugent-cli/commit/666cd8bc82ec26f88835b8cd7388b9ef81eac763))
* **ts-migration:** finalize TypeScript migration and dryrun module refactor ([5f0fe10](https://github.com/carmelyne/dokugent-cli/commit/5f0fe101311f3282b35b61691b27e6a875a0f004))
* **ui-demo:** convert sample logs to paddedSub and paddedLog blocks + glyphs preview ([d563c9a](https://github.com/carmelyne/dokugent-cli/commit/d563c9a703d64ee3061cc5ecd46d941910525a49))
* **ui:** color-code paddedLog output for signer roles ([184b7b1](https://github.com/carmelyne/dokugent-cli/commit/184b7b12fbdd8ddd57ef1c8656c56ffec91283c2))
* unify plan schema, cleanup wizards, drop preview cmd ([ec48a1e](https://github.com/carmelyne/dokugent-cli/commit/ec48a1ea5459ad23d9e5e8e148b390dbcdd22890))
* update conventions, compile, and utils ([5f91a61](https://github.com/carmelyne/dokugent-cli/commit/5f91a61ce5c3301935d057799cdcd63df043e79f))


### Bug Fixes

* **conventions:** clean symlink logic, remove custom/ nesting, dynamic filtering of templates ([f1f8a6b](https://github.com/carmelyne/dokugent-cli/commit/f1f8a6b444c38c6ac99daed5cf460673fd028e04))
* **deploy:** prevent double wizard run by passing resolved identity to certify ([d05f9db](https://github.com/carmelyne/dokugent-cli/commit/d05f9db5391ab7adf99090eb0313362784735484))
* **init:** isolate --yes agent file writes to prevent duplication ([503ee1c](https://github.com/carmelyne/dokugent-cli/commit/503ee1c70bc6fefa6e4a286ec368beb267be4867))
* **plan:** restore accurate folder listing in plan ls ([fbdd059](https://github.com/carmelyne/dokugent-cli/commit/fbdd05975f00f280a833e165be765a44041d087f))
* **test:plan:** stabilize plan wizard test using yes  for stdin piping ([44e86c9](https://github.com/carmelyne/dokugent-cli/commit/44e86c98587c2d3b828368d87b6567565099aca2))
* wiz components and glyph fallback ([2d1ed69](https://github.com/carmelyne/dokugent-cli/commit/2d1ed697d5e5728b638431626144c4216f17eecc))
