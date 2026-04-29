# Hosting Bracket — Deployment Guide

> **Important note about Hostinger plans**
>
> The Bracket app is built with **Python (FastAPI)** and **PostgreSQL**. It needs a server
> where you can run long-lived background processes and install software — this is called a
> **VPS (Virtual Private Server)**.
>
> The **Hostinger Cloud / Shared Hosting** plans (including Cloud Start-up) are designed for
> PHP websites and WordPress. They do **not** support Docker, Python applications, or
> PostgreSQL, so Bracket cannot run on those plans as-is.
>
> The good news: Hostinger's own **KVM VPS** plans start at around the same price as some
> cloud hosting plans, and everything below is a step-by-step guide for getting set up on one.

---

## Which Hostinger Plan Do You Need?

| Plan type | Supports Bracket? | Notes |
|---|---|---|
| Cloud Start-up / Cloud hosting | ❌ No | PHP/WordPress only, no Docker or Python |
| Shared hosting | ❌ No | Same limitation |
| **KVM VPS (any tier)** | ✅ **Yes** | Full Linux server — this is what you need |

The **KVM 1** plan (1 vCPU, 4 GB RAM) is more than enough for a youth club.  
You can keep your existing Cloud plan for other websites — just add a VPS for Bracket.

👉 [Hostinger KVM VPS plans](https://www.hostinger.com/vps-hosting)

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Hostinger KVM VPS | Choose **Ubuntu 22.04 LTS** as the OS when setting it up. |
| A domain or subdomain | Point an **A record** at your VPS IP (e.g. `bracket.yourclub.com`). If you already own a domain on your Cloud plan you can add a subdomain and point it at the VPS IP. |

---

## 1 — Log In to Your VPS

Hostinger emails you the root password and IP address when your VPS is ready.

```bash
ssh root@YOUR_VPS_IP
```

Update the system and install Docker:

```bash
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | bash

# Install Docker Compose plugin
apt install docker-compose-plugin -y

# Verify
docker compose version
```

---

## 2 — Clone the Repository

```bash
git clone https://github.com/youthworkerhub/brackets.git /opt/bracket
cd /opt/bracket
```

---

## 3 — Configure Environment Variables

```bash
cp docker-compose.yml docker-compose.prod.yml
nano docker-compose.prod.yml
```

Set the following on the **backend** service:

```yaml
environment:
  # Database — change the password to something strong
  PG_DSN: postgresql://bracket:CHANGE_ME@db/bracket

  # Generate with: openssl rand -hex 32
  JWT_SECRET: REPLACE_WITH_LONG_RANDOM_STRING

  # Your domain (no trailing slash)
  CORS_ORIGINS: https://bracket.yourclub.com

  # Frontend is served by the backend
  SERVE_FRONTEND: "true"
  API_PREFIX: /api

  ENV: PRODUCTION
```

And update the **db** service password to match:

```yaml
environment:
  POSTGRES_PASSWORD: CHANGE_ME
```

---

## 4 — Set Up HTTPS (Automatic, Free)

Install Caddy — it handles TLS certificates from Let's Encrypt automatically:

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install caddy -y
```

Create `/etc/caddy/Caddyfile`:

```
bracket.yourclub.com {
    reverse_proxy localhost:3000
}
```

Reload Caddy:

```bash
systemctl reload caddy
```

---

## 5 — Build and Start the App

```bash
cd /opt/bracket
docker compose -f docker-compose.prod.yml up -d --build
```

The app will be available at **https://bracket.yourclub.com**.

Default login (change these immediately after first login!):

| Field | Value |
|---|---|
| Email | `test@example.org` |
| Password | `aeGhoe1ahng2Aezai0Dei6Aih6dieHoo` |

Go to **User → Change Password** straight away.

---

## 6 — Using QR Code Registration

1. Log in as admin and open your tournament's **Settings** page.
2. Scroll to **Online Sign-Up (QR Code Registration)**.
3. Toggle **Allow public sign-ups** on and click **Save**.
4. Click **Download QR Code (PNG)** — print this on a poster in the youth club.
5. Young people scan the code, type their name in the form (no account needed), and tap **Sign Me Up!**
6. Their name appears in the **Players** and **Teams** tabs as *inactive*.
7. You review the list and mark players **active** before the tournament starts.

---

## 7 — Keeping the App Updated

```bash
cd /opt/bracket
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 8 — Backups

```bash
docker exec bracket-db pg_dump -U bracket bracket > backup_$(date +%F).sql
```

Copy the file off the server with `scp`, or use Hostinger's **VPS Snapshot** feature in
the control panel for a full server backup.

---

## Data Privacy

All tournament and player data is stored exclusively on your VPS server.  
No data is sent to any external company or service.  
Young people only provide their **name** when signing up via the QR code form.
