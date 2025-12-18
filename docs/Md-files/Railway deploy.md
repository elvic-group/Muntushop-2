# Railway deploy md   
  
How to save it as DEPLOY_GREENAPI_RAILWAY.md  
How to save it as DEPLOY_GREENAPI_RAILWAY.md  
1. In Cursor (or any editor), create a new file named: DEPLOY_GREENAPI_RAILWAY.md.   
2. Paste this exact content and save:  
  
text  
text  
# Deploy Green‑API Webhook Server to Railway (CLI, FastAPI/Python)  
  
Use this as a step‑by‑step prompt/instruction inside Cursor.  
  
---  
  
## 1. Project setup (local)  
  
1. Create a new folder for your project, for example:  
mkdir greenapi-webhook cd greenapi-webhook  
mkdir greenapi-webhook cd greenapi-webhook  
  
text  
2. Create `main.py` with a basic FastAPI app that exposes a webhook endpoint and reads env vars:  
from fastapi import FastAPI, Request import os  
app = FastAPI()  
app = FastAPI()  
ID_INSTANCE = os.environ.get("ID_INSTANCE") API_TOKEN_INSTANCE = os.environ.get("API_TOKEN_INSTANCE") WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "")  
ID_INSTANCE = os.environ.get("ID_INSTANCE") API_TOKEN_INSTANCE = os.environ.get("API_TOKEN_INSTANCE") WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "")  
@app.get("/") async def root(): return {"status": "ok", "instance": ID_INSTANCE}  
@app.post("/webhook") async def webhook(request: Request): # Optionally verify WEBHOOK_SECRET here payload = await request.json() # TODO: handle incoming Green-API events print("Incoming webhook:", payload) return {"received": True}  
@app.post("/webhook") async def webhook(request: Request): # Optionally verify WEBHOOK_SECRET here payload = await request.json() # TODO: handle incoming Green-API events print("Incoming webhook:", payload) return {"received": True}  
  
text  
text  
3. Create `requirements.txt`:  
fastapi uvicorn[standard] whatsapp-api-webhook-server-python-v2  
fastapi uvicorn[standard] whatsapp-api-webhook-server-python-v2  
  
text  
4. (Optional but recommended) Create a `Procfile` or note the start command you will use:  
web: uvicorn main:app --host 0.0.0.0 --port $PORT  
web: uvicorn main:app --host 0.0.0.0 --port $PORT  
  
text  
text  
---  
  
## 2. Install Railway CLI and log in  
  
1. Install Railway CLI globally (Node.js required):  
npm i -g @railway/cli  
  
text  
text  
2. Log in:  
railway login  
railway login  
  
text  
text  
3. Verify:  
railway whoami  
railway whoami  
  
text  
text  
---  
  
## 3. Initialize Railway project from CLI  
  
From inside the `greenapi-webhook` folder:  
  
1. Initialize and link the directory:  
railway init  
railway init  
  
text  
text  
- Choose **Create New Project** (or link to an existing one).  
- Follow the prompts.  
  
2. (Optional) Open the project in the browser:  
railway open  
railway open  
  
text  
---  
  
## 4. Configure environment variables in Railway  
  
1. In the Railway web dashboard, open the project created by `railway init`.  
2. Go to your service → **Variables**.  
3. Add the following variables (from your Green‑API console):  
- `ID_INSTANCE`  
- `API_TOKEN_INSTANCE`  
- `WEBHOOK_SECRET` (optional, for verifying requests)  
4. Save variables.  
  
Your FastAPI app reads them from `os.environ` as in `main.py`.  
  
---  
  
## 5. Define how Railway runs the app  
  
### Option A – Set start command in UI  
  
1. In your service → **Settings** → **Start Command**, set:  
uvicorn main:app --host 0.0.0.0 --port $PORT  
  
text  
text  
### Option B – `railway.toml` (in repo)  
  
1. Create `railway.toml` in the project root:  
[service] name = "greenapi-webhook"  
[service] name = "greenapi-webhook"  
[deploy] startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"  
[deploy] startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"  
  
text  
text  
---  
  
## 6. Deploy using Railway CLI  
  
From the `greenapi-webhook` directory:  
  
1. Run:  
railway up  
railway up  
  
text  
text  
- This uploads the current directory and triggers a deploy.  
  
2. Wait for the build to complete (you can view logs in the terminal or open the Railway dashboard).  
  
3. For CI or non‑interactive:  
railway up --detach  
railway up --detach  
  
text  
text  
---  
  
## 7. Get public URL for webhooks  
  
1. In Railway, open your service page.  
2. Go to **Settings → Networking**.  
3. Click **Generate Domain** if not already set.  
4. Copy the URL, e.g.:  
[https://your-service-name.up.railway.app](https://your-service-name.up.railway.app/)  
[https://your-service-name.up.railway.app](https://your-service-name.up.railway.app/)  
  
text  
5. Your webhook endpoint will be, for example:  
[https://your-service-name.up.railway.app/webhook](https://your-service-name.up.railway.app/webhook)  
[https://your-service-name.up.railway.app/webhook](https://your-service-name.up.railway.app/webhook)  
  
text  
text  
---  
  
## 8. Configure Green‑API to send webhooks to Railway  
  
1. Open the Green‑API console and select your instance.  
2. In webhook settings, set the **Webhook URL** to:  
[https://your-service-name.up.railway.app/webhook](https://your-service-name.up.railway.app/webhook)  
[https://your-service-name.up.railway.app/webhook](https://your-service-name.up.railway.app/webhook)  
  
text  
text  
3. Enable the events you want (incoming messages, status updates, etc.).  
4. Save the configuration and make sure the instance is authorized and online.  
  
---  
  
## 9. Test the full flow  
  
1. In Railway, open **Logs** for your `greenapi-webhook` service.  
2. Send a WhatsApp message to the phone number bound to your Green‑API instance.  
3. Confirm that:  
- Railway logs show a POST to `/webhook`.  
- Your app prints `Incoming webhook: ...`.  
4. Adjust your handler logic in `main.py` as needed to process and respond to events.  
  
---  
  
## 10. Quick checklist  
  
- [ ] `main.py` exists and exposes `app = FastAPI()`.  
- [ ] `requirements.txt` includes `fastapi`, `uvicorn[standard]`, and Green‑API library.  
- [ ] Railway CLI installed and authenticated.  
- [ ] `railway init` run in the project folder.  
- [ ] Env vars `ID_INSTANCE`, `API_TOKEN_INSTANCE`, `WEBHOOK_SECRET` added in Railway.  
- [ ] Start command set (`uvicorn main:app --host 0.0.0.0 --port $PORT`).  
- [ ] `railway up` succeeded without errors.  
- [ ] Railway domain generated and configured as webhook URL in Green‑API.  
- [ ] Webhook events visible in Railway logs.  
##   
##   
