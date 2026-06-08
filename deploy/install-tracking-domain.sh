#!/bin/bash
# Install nginx + Let's Encrypt SSL for a new tracker subdomain
# Usage: sudo bash install-tracking-domain.sh track.nexoquote.com

set -euo pipefail

HOST="${1:-}"
if [ -z "$HOST" ]; then
  echo "Usage: sudo bash install-tracking-domain.sh track.example.com"
  exit 1
fi

CONF="/etc/nginx/sites-available/${HOST}.conf"
ENABLED="/etc/nginx/sites-enabled/${HOST}.conf"
CERT="/etc/letsencrypt/live/${HOST}/fullchain.pem"

write_ssl_config() {
  cat > "$CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${HOST};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${HOST};

    ssl_certificate /etc/letsencrypt/live/${HOST}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${HOST}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
}

write_http_config() {
  cat > "$CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${HOST};

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
}

ln -sf "$CONF" "$ENABLED"

if [ ! -f "$CERT" ]; then
  echo "=== HTTP-only config (for certbot) ==="
  write_http_config
  nginx -t && systemctl reload nginx
  certbot certonly --nginx -d "${HOST}" --non-interactive --agree-tos -m essaidmadi@gmail.com
fi

echo "=== SSL nginx config ==="
write_ssl_config
nginx -t && systemctl reload nginx

echo "Done. Test: curl -sI https://${HOST}/lp1"
