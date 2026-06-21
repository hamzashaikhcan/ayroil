#!/usr/bin/env bash
# Deploy ayroil services on Hetzner from CI-built artifacts.
# Unlike the other stacks on this box, ayroil is NOT built here: GitHub
# Actions already built each app and scp'd a tarball to
# /opt/ayroil/<app>/releases/<sha>/release.tar.gz, and rewrote
# /opt/ayroil/shared/<envfile> from the GitHub Environment's variables.
# This script only extracts, drops in the env file, swaps the `current`
# symlink, and reloads the matching PM2 process.
#   Usage: deploy-remote.sh <express-backend|next-frontend|admin-panel|all> <git-sha>
set -euo pipefail
APP="${1:?usage: deploy-remote.sh <express-backend|next-frontend|admin-panel|all> <sha>}"
SHA="${2:?usage: deploy-remote.sh <app> <sha>}"
export PATH=/root/.nvm/versions/node/v20.19.0/bin:$PATH
ROOT=/opt/ayroil

# Serialize deploys: concurrent runs must not race on `current` symlinks or pm2.
exec 9>/tmp/ayroil-deploy.lock
flock 9

deploy_one() {
  # $3 = persistent shared env filename (unique per app, e.g. next-frontend.env)
  # $4 = filename Next.js/dotenv actually expects in the app's own cwd
  local app="$1" pm2name="$2" shared_envfile="$3" target_envfile="$4"
  local dir="$ROOT/$app"
  local rel="$dir/releases/$SHA"
  echo "[ayroil] === deploying $app ($SHA) ==="
  [ -d "$rel" ] || { echo "[ayroil] missing release dir $rel"; exit 1; }
  cp "$ROOT/shared/$shared_envfile" "$rel/$target_envfile"
  ln -sfn "$rel" "$dir/current"
  if pm2 describe "$pm2name" >/dev/null 2>&1; then
    pm2 reload "$pm2name" --update-env
  else
    pm2 start "$ROOT/ecosystem.config.js" --only "$pm2name"
  fi
  # Keep the 3 most recent releases per app, prune older ones.
  ls -1dt "$dir"/releases/*/ 2>/dev/null | tail -n +4 | xargs -r rm -rf
}

case "$APP" in
  express-backend) deploy_one express-backend ayroil-backend express-backend.env .env ;;
  next-frontend)   deploy_one next-frontend   ayroil-frontend next-frontend.env   .env.local ;;
  admin-panel)     deploy_one admin-panel     ayroil-admin    admin-panel.env     .env.local ;;
  all)
    deploy_one express-backend ayroil-backend express-backend.env .env
    deploy_one next-frontend   ayroil-frontend next-frontend.env   .env.local
    deploy_one admin-panel     ayroil-admin    admin-panel.env     .env.local
    ;;
  *) echo "unknown app: $APP"; exit 1 ;;
esac
pm2 save
echo "[ayroil] === DEPLOY COMPLETE: $APP ($SHA) ==="
