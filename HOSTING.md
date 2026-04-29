# Hosting Bracket on Hostinger VPS

This guide walks you through deploying the Bracket tournament app on a
[Hostinger VPS](https://www.hostinger.com/vps-hosting) so that everything stays
in-house — no young people's data is ever sent to a third-party service.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Hostinger KVM VPS | Any plan works; the **KVM 1** plan (1 vCPU, 4 GB RAM) is sufficient for a club. |
| Ubuntu 22.04 LTS | Choose this OS image when setting up the VPS in the Hostinger panel. |
| A domain name | Point an A record at your VPS IP (e.g. `bracket.yourclub.com`). |

---

## 1 — Set Up the VPS

Log in to your VPS via SSH using the credentials from Hostinger:

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

Copy the example env file and edit it:

```bash
cp docker-compose.yml docker-compose.prod.yml
```

Open `docker-compose.prod.yml` in a text editor (`nano docker-compose.prod.yml`) and set
the following environment variables on the **backend** service:

```yaml
environment:
  # Database — change the password to something strong
  PG_DSN: postgresql://bracket:CHANGE_ME@db/bracket

  # Set a long random secret (run: openssl rand -hex 32)
  JWT_SECRET: REPLACE_WITH_LONG_RANDOM_STRING

  # Your domain (no trailing slash)
  CORS_ORIGINS: https://bracket.yourclub.com

  # Frontend is served by the backend in production
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

## 4 — Set Up HTTPS with a Reverse Proxy

Install Caddy (a simple web server that handles HTTPS automatically):

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

Restart Caddy:

```bash
systemctl reload caddy
```

> Caddy will automatically obtain a free TLS certificate from Let's Encrypt.

---

## 5 — Build and Start the App

```bash
cd /opt/bracket
docker compose -f docker-compose.prod.yml up -d --build
```

The app will be available at **https://bracket.yourclub.com**.

Default login credentials (change these immediately!):

| Field | Value |
|---|---|
| Email | `test@example.org` |
| Password | `aeGhoe1ahng2Aezai0Dei6Aih6dieHoo` |

To change the password, log in and go to **User → Change Password**.

---

## 6 — Using QR Code Registration

1. Log in as admin and go to your tournament's **Settings** page.
2. Scroll to **Online Sign-Up (QR Code Registration)**.
3. Toggle **Allow public sign-ups** on and click **Save**.
4. Click **Download QR Code (PNG)** to get a printable poster-ready QR code.
5. When young people scan the code they land on a simple form (no account needed) and submit their name.
6. Their name appears in the **Players** and **Teams** tab as *inactive*.  
   The organiser reviews the list and marks players as **active** before the tournament starts.

---

## 7 — Keeping the App Updated

```bash
cd /opt/bracket
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 8 — Backups

Back up the PostgreSQL database regularly:

```bash
docker exec bracket-db pg_dump -U bracket bracket > backup_$(date +%F).sql
```

Copy the backup off the server with `scp` or use Hostinger's VPS snapshot feature.

---

## Data Privacy

All tournament and player data is stored exclusively on your VPS.  
No data is sent to any external service.  
Young people only provide their **name** when registering via the QR code form.
