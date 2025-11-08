# Decap CMS + GitLab PKCE Setup

This project uses Decap CMS with the GitLab backend and the **PKCE** flow.  
When GitLab is configured correctly, the CMS login works entirely in the browser and never exposes client secrets.

This guide explains how to set up (or repair) the OAuth application so 401 Unauthorized errors disappear.

---

## 1. Create or Update the GitLab OAuth Application

1. **Open GitLab → User Settings → Applications → New application**
2. Fill in:
   - **Name:** `lum.bio CMS` (any label is fine)
   - **Redirect URIs (add every domain you use):**
     ```
     https://lum.bio/admin/
     https://lum-bio-mh2.pages.dev/admin/
     http://localhost:5173/admin/         # optional for local testing
     ```
   - **Scopes:** check only `api`
   - **Confidential:** **UN-CHECK** this box  
     - This is the critical step. PKCE only works with *non-confidential* apps.  
       If the box stays checked, GitLab expects a client secret during the token
       exchange and Decap CMS will receive `401 Unauthorized (invalid_client)`.
3. Click **Save application**
4. Copy the generated **Application ID**

If you already created the application, just edit it, uncheck **Confidential**, add any missing redirect URIs, and save. The Application ID stays the same.

---

## 2. Update the Decap CMS Config

Paste the Application ID into `public/admin/config.yml`:

```yaml
backend:
  name: gitlab
  repo: lummuu/lum.bio
  branch: main
  auth_type: pkce
  app_id: YOUR_APPLICATION_ID
```

Commit and redeploy if the value changes.

---

## 3. Quick Health Checks

### A. Verify the token endpoint

Run this from any terminal (replace `<APP_ID>` with yours). A properly configured app returns `invalid_grant`.  
If you keep seeing `invalid_client`, the GitLab app is still marked confidential or the ID is wrong.

```bash
curl -s -X POST https://gitlab.com/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'client_id=<APP_ID>&grant_type=authorization_code&code=fake&code_verifier=fake&redirect_uri=https://lum-bio-mh2.pages.dev/admin/'
```

Expected response:

```json
{"error":"invalid_grant","error_description":"The provided authorization grant is invalid..."}
```

If you see `invalid_client`, go back to Step 1 and uncheck **Confidential**.

### B. Confirm redirect URLs

Login errors mentioning `invalid_redirect_uri` mean a domain is missing from the GitLab application. Add every domain where `/admin/` is served (production, preview, localhost).

---

## 4. Local Development (Optional)

1. Uncomment `local_backend: true` in `public/admin/config.yml`
2. Run the proxy in one terminal:
   ```bash
   npx decap-server --config public/admin/config.yml
   ```
3. Run Vite in another terminal (`npm run dev`)
4. Visit `http://localhost:5173/admin/`

Remember to comment `local_backend` before committing.

---

## 5. Troubleshooting Cheat Sheet

| Symptom | Fix |
| --- | --- |
| `401 Unauthorized` right after GitLab login | GitLab OAuth app is confidential or the Application ID is wrong. Uncheck **Confidential** and re-save. |
| `invalid_redirect_uri` | Add the missing `{domain}/admin/` URL to the GitLab application. |
| `access denied` after login | The GitLab user needs at least **Maintainer** access (protected branches require it). |
| CMS keeps spinning on login | Clear browser cookies for `gitlab.com` and try again; stale PKCE data can block retries. |

Once the GitLab application is non-confidential and the redirect URIs match, Decap CMS login should succeed without any code changes.

---

**Last updated:** 2025-11-08
