# pizza-calc

A pizza dough calculator: enter how many pizzas you want and the schedule you
can actually keep, and it works out the flour, water, salt and yeast, plus the
timings to go with them.

- Baker's-percentage recipe for any number of pizzas and ball weight
- Yeast derived from fermentation time and temperature, for fresh, instant or
  active dry yeast — see [docs/fermentation-model.md](docs/fermentation-model.md)
- Optional correction for the dough's cooling-down time, so batch size and
  retarding in bulk vs. as balls feed into the yeast figure; toggle it off to
  fall back to the plain wall-clock estimate
- Presets for Neapolitan, New York and Roman, plus a free-form mode
- Step-by-step instructions generated from your own schedule, with a slider to
  split the room-temperature time either side of the fridge
- German and English, metric and imperial
- Dark mode

## Development

```bash
npm install
npm run dev        # dev server
npm run typecheck  # tsc, includes the translation completeness check
npm run lint
npm run build      # production build into dist/
```

`src/i18n/locales/en.json` is the reference key set. `de.json` is checked
against it with `satisfies` in [src/i18n/index.ts](src/i18n/index.ts), so a
missing or misspelt German key fails `npm run typecheck` instead of silently
falling back to English.

### Layout

```
src/
  components/     presentational React components
  i18n/           i18next setup + en/de locale files
  lib/
    math.ts       clamping, rounding, interpolation, table lookup
    units.ts      metric <-> imperial conversion and formatting
    recipe.ts     input limits, style presets, baker's-percentage maths
    fermentation/ the yeast model: factor tables, yeast maths, room schedule,
                  cooling-curve correction
docs/
  fermentation-model.md
```

Everything in `lib/` works in metric base units (grams, °C, hours). Conversion
to the unit system on screen happens only in the components.

## Deployment

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds on every
push to `main` and uploads the result to IONOS over SFTP with `lftp`.

### Configuration

Repository **secrets**:

| name              | required | purpose                                        |
| ----------------- | -------- | ---------------------------------------------- |
| `SSH_HOST`        | yes      | IONOS SSH host                                 |
| `SSH_USER`        | yes      | SSH user                                       |
| `SSH_PRIVATE_KEY` | one of   | deploy key — preferred                         |
| `SSH_PASSWORD`    | one of   | password, used when no key is set              |
| `SSH_KNOWN_HOSTS` | no       | pinned host key; without it the workflow runs `ssh-keyscan` and warns |
| `AUTH_USER`       | no       | enables HTTP basic auth when set               |
| `AUTH_PASSWORD`   | no       | password for basic auth                        |

Repository **variables**:

| name             | default | purpose                                          |
| ---------------- | ------- | ------------------------------------------------ |
| `REMOTE_PATH`    | —       | target directory on the server (required)        |
| `SSH_PORT`       | `22`    | SSH port                                         |
| `BASE_PATH`      | `/`     | set to e.g. `/pizza-calc/` when serving from a subdirectory |
| `SITE_URL`       | —       | when set, the deploy is verified over HTTP afterwards |
| `HTPASSWD_PATH`  | `$REMOTE_PATH/.htpasswd` | absolute server path written into `AuthUserFile` |

`REMOTE_PATH` and `SSH_PORT` also fall back to the older `SSH_REMOTE_PATH` and
`SSH_PORT` secrets.

### Re-running an old run is a rollback

The upload runs `lftp mirror --delete --transfer-all`, so after every deploy the
remote directory is byte-for-byte the build output — every file re-uploaded,
anything left over from another deploy removed.

Combined with `actions/checkout` pinning to `github.sha` and `npm ci` installing
from that commit's lockfile, **"Re-run all jobs" on any past run puts the server
back into exactly that run's state.**

Use *Re-run all jobs*, not *Re-run failed jobs*: the latter reuses the stored
build artifact, which expires after 90 days.

`workflow_dispatch` also takes a `dry_run` input that runs the mirror with
`--dry-run` so you can see which files would change before committing to it.

> **Careful:** `--delete` means anything in `REMOTE_PATH` that is not part of
> the build gets removed. Point it at a directory this site owns exclusively.

### Docker

[`Dockerfile`](Dockerfile) builds the same static output and serves it with
nginx, if you would rather run it as a container:

```bash
docker build -t pizza-calc .
docker run --rm -p 8080:80 pizza-calc
```
