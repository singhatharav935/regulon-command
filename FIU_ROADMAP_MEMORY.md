# SANNIDH Production Go-Live Roadmap

## MEMORY RECORDED:
The system is currently operating in **Sandbox Mode** (Step 1). The founder has explicitly mandated that we must transition to **Production Mode** (Step 2) for real CA clients soon.

## Step 1: Sandbox Integration (COMPLETED & ACTIVE)
- The SANNIDH backend is currently wired to the Setu Account Aggregator Sandbox API (`https://sandbox.setu.co`).
- The `ai-financial-swarm` Edge Function autonomously pulls bank data via HTTP GET requests upon client consent.
- OpenAI integration is built-in for intelligent categorization.
- **Action Required by Founder:** Go to `bridge.setu.co`, generate Sandbox keys, and inject them into Supabase via `npx supabase secrets set SETU_CLIENT_ID=...`.

## Step 2: Production Legalities (TO DO SOON)
To switch to real bank data (HDFC, ICICI, SBI):
1. **FIU Registration:** Register SANNIDH as a Financial Information User under RBI guidelines.
2. **Sahamati Approval:** Register with the Sahamati alliance.
3. **Security Audit:** Pass the Infosec audit for the Supabase infrastructure.
4. **API Upgrade:** Replace Sandbox keys with Production keys in Supabase.

*Status: Acknowledged by AI Agent. Will remind founder before public launch.*
