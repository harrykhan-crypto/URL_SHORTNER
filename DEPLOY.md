# Deploying MakeLink

MakeLink has three parts, each on a free plan:

| Part | Service | What it does |
|---|---|---|
| Database | MongoDB Atlas (M0 free) | Stores links; deletes them after 90 days |
| API | Render (free web service) | Creates short links and redirects them |
| Website | Vercel (Hobby) | The page people use; forwards `/api/*` and `/<code>` to the API |

Short links live on your Vercel domain (e.g. `https://your-site.vercel.app/abc1234`).
Vercel forwards them to Render, which looks up the code and redirects.

Do the steps in this order: each one needs an address from the one before.

---

## 1. MongoDB Atlas (database)

1. Sign up at <https://www.mongodb.com/cloud/atlas/register> and create a **free M0** cluster.
2. **Database Access** → *Add New Database User* → choose a username and a strong password.
   Avoid `@ : / ? # %` in the password, or URL-encode them.
3. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`).
   Render's free plan has no fixed IP, so this is required.
4. **Connect** → *Drivers* → copy the connection string and add a database name before the `?`:

   ```text
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/makelink?retryWrites=true&w=majority
   ```

   This is your **`MONGO_URI`**. Keep it secret; never commit it.

## 2. Vercel (website) — first pass

1. Sign in at <https://vercel.com> with GitHub → **Add New… → Project** → import this repo.
2. **Project Name**: this becomes your address, `https://<name>.vercel.app`.
3. **Root Directory**: `client`. Vercel detects Vite automatically.
4. Optional environment variable: `VITE_CLARITY_ID` (your own Microsoft Clarity project ID).
   Leave it out to turn analytics off.
5. **Deploy.** The page will load, but shortening won't work yet. Note your address,
   e.g. `https://your-site.vercel.app`.

## 3. Render (API)

1. Sign in at <https://render.com> with GitHub → **New + → Blueprint** → pick this repo.
   Render reads `render.yaml` and creates the `makelink-api` service.
2. Fill in the two values it asks for:
   - `MONGO_URI`: from step 1
   - `BASE_URL`: your Vercel address from step 2, **no trailing slash**
3. **Apply.** When the deploy finishes, note the service address,
   e.g. `https://makelink-api-xxxx.onrender.com`.
4. Check it: open `https://makelink-api-xxxx.onrender.com/api/ping`.
   You should see `{"status":"ready",...}`. The first load can take about a minute.

## 4. Connect the website to the API

1. In `client/vercel.json`, replace both `YOUR-API.onrender.com` with your Render host
   (e.g. `makelink-api-xxxx.onrender.com`).
2. Commit and push to `main`. Vercel redeploys automatically.
3. Open your site, shorten a link, open the short link. Done.

## 5. Keep the database awake (optional, recommended)

Atlas pauses free clusters after long inactivity. The `Keep Alive` GitHub Action pings
the API daily, which touches the database.

GitHub repo → **Settings → Secrets and variables → Actions → Variables** →
**New repository variable**: `API_URL` = your Render address.

---

## Environment variables

**API (Render / `server/.env`)**

| Name | Required | Example | Notes |
|---|---|---|---|
| `MONGO_URI` | yes | `mongodb+srv://…/makelink` | Atlas connection string |
| `BASE_URL` | yes | `https://your-site.vercel.app` | Domain short links are built on |
| `TRUST_PROXY` | no | `2` | Proxy hops; `2` for Vercel → Render (set by `render.yaml`) |
| `CORS_ORIGIN` | no | `https://your-site.vercel.app` | Comma-separated; defaults to `*` |

**Website (Vercel / `client/.env.local`)**

| Name | Required | Notes |
|---|---|---|
| `VITE_API_URL` | no | Defaults to `/api` in production, `http://localhost:5000/api` in dev |
| `VITE_SITE_URL` | no | Defaults to your Vercel production domain |
| `VITE_CLARITY_ID` | no | Microsoft Clarity ID; unset = no analytics |

## Things to know about free plans

- **Render sleeps after ~15 minutes idle.** The first visit after that takes up to a
  minute; the site shows "Waking server" meanwhile. A paid instance removes this.
- **Abuse.** A public shortener will attract spam and phishing links. The API is rate
  limited, but keep an eye on your Atlas collection and delete bad links
  (`db.urls.deleteOne({ urlCode: "..." })`). If it becomes a problem, add a URL
  blocklist or Google Safe Browsing check.
