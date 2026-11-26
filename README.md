# My app

A starter for a Robutler app: a counter that remembers its value for you. Use it as a template, then make it yours.

## Layout

No build step. `app/` is the served folder, exactly what a release takes; everything else stays in the repository.

| Path | What it is |
| --- | --- |
| `app/index.html` | Entry. The app declaration (`robutler:widget` meta), the platform SDK, and `app.js?v=N` |
| `app/app.js` | The app. Its state is kept per person in `host.kv` |
| `app/widget.json` | Manifest: the entry, and what the app is allowed to reach (nothing beyond its own files) |
| `robutler.json` | Release settings: the app type, the served folder `app`, no build |
| `test/check.mjs` | Repository check, run by CI: the manifest, the app declaration, the entry pin, copy rules |
| `.github/workflows/release.yml` | Releases the app when a version tag is pushed |
| `package.json` | Pins the CLI (`webagents`, which provides the `robutler` command) |

When you change `app/app.js`, bump `app.js?v=N` in `app/index.html`: it is the cache key for the entry.

## From this folder to a released app

Install the pinned CLI and sign in:

```bash
npm install
npx robutler login
```

Create the app and put your files in its draft. `create` binds this folder to the new app in `.robutler/app.json`
(ids only, safe to commit). The draft is private to you.

```bash
npx robutler app create my-app
npx robutler app push
npx robutler app status
```

Connect this repository as the app's source. The link is finished in your browser, as the app's owner:

```bash
npx robutler app link <owner>/<repo> --path app
```

Release a tag. The command shows the commit and what the release changes in what the app may reach, with a hash.
The first release makes the app public, so it asks for your acceptance: run it again with the hash it printed.

```bash
git tag v1 && git push origin v1
npx robutler app release --ref v1 --expect-commit "$(git rev-parse v1)"
npx robutler app release --ref v1 --expect-commit "$(git rev-parse v1)" --accept-security <hash>
```

## Releases from CI

After the first release, a pushed tag can release the app with no terminal.

1. In the app's source settings, turn on "Release from this repository's tags".
2. Store a release token as a repository secret. It is shown once and can release this app and nothing else:

   ```bash
   npx robutler app token create | gh secret set ROBUTLER_RELEASE_TOKEN
   ```

3. Put your app's id (from `npx robutler app status`) in `.github/workflows/release.yml`.

Then `git tag v2 && git push origin v2` releases version 2. A version that lets the app reach more than the current
one is not released from CI: you are asked to approve it.

## Secrets and functions

If the app has server functions, set a secret a function declares from standard input, never on the command line:

```bash
printf %s "$API_KEY" | npx robutler app secrets set API_KEY --function <name>
npx robutler app logs --function <name>
```

## Check

```bash
npm run check
```
