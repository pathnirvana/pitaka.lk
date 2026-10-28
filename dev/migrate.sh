#!/usr/bin/env bash
# One-time move of pitaka.lk from the old droplet to the tipitaka.lk droplet, where the new reader runs at /main/
# (pitaka_lk.service: pathnirvana/tipitaka.lk scripts/deploy.sh --flavor pitaka, dev-docs/pitaka-flavor.md Phase 5).
# Run the steps in order; each can be rerun.
#   dev/migrate.sh copy    copy ~/www/pitaka.lk (4.7 GB: bjt scans, books, pirith, ...) from the old droplet to the new
#                          one, droplet to droplet with this machine's ssh key (agent forwarding). Left behind: the old
#                          main/, the checkout's .git (4.8 GB), dev/ (old tooling, 1.3 GB) and pirith-old/ - none served
#   dev/migrate.sh nginx   install the vhost, the node-id map and the certificate of pitaka.lk (with its certbot account,
#                          so the new droplet renews it), then test the site through the new ip - sudo passwords
#   ... switch the A record of pitaka.lk to the new ip in DigitalOcean (Networking > Domains) ...
#   dev/migrate.sh check   after the switch: the site through DNS, and a certbot renewal dry run on the new droplet
set -euo pipefail
OLD=${OLD:-188.166.222.89}                  # the old droplet (pitaka.lk's A record before the switch)
NEW=${NEW:-tipitaka.lk} NEW_IP=${NEW_IP:-157.230.192.72}
ROOT=www/pitaka.lk
SSH_OLD=(ssh -o StrictHostKeyChecking=accept-new "janaka@$OLD")
cd "$(dirname "$0")/.."

# a few pages of each kind: the reader, old links, a static site
probe() {
  for u in /main/ /main/dn-1-1 '/main?n=15' /15 /books/ /tools/map.html /robots.txt; do
    printf '  %-16s %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$@" "https://pitaka.lk$u")"
  done
}

case "${1:-}" in
  copy)
    ssh-add -l >/dev/null 2>&1 || ssh-add
    ssh -A "$NEW" "mkdir -p $ROOT && rsync -a --info=progress2 -e 'ssh -o StrictHostKeyChecking=accept-new' --exclude=/main/ --exclude=/.git/ --exclude=/dev/ --exclude=/pirith-old/ janaka@$OLD:$ROOT/ $ROOT/"
    echo "copied. Then this repo's files: dev/deploy.sh --go"
    ;;
  nginx)
    echo "the certificate of pitaka.lk on the old droplet - sudo password there:"
    "${SSH_OLD[@]}" -t "sudo sh -c 'cd /etc/letsencrypt && acc=\$(sed -n \"s/^account = //p\" renewal/pitaka.lk.conf) \
      && tar czf /tmp/le-pitaka.tgz live/pitaka.lk archive/pitaka.lk renewal/pitaka.lk.conf accounts/*/directory/\$acc \
      && chown janaka /tmp/le-pitaka.tgz'"
    scp -3 -o StrictHostKeyChecking=accept-new "janaka@$OLD:/tmp/le-pitaka.tgz" "$NEW:/tmp/le-pitaka.tgz"
    "${SSH_OLD[@]}" rm -f /tmp/le-pitaka.tgz
    scp nginx/pitaka.lk.conf nginx/nodeid_mapping.map "$NEW:/tmp/"
    echo "installing the certificate (kept if there is one), the vhost and the map on $NEW - sudo password there:"
    ssh -t "$NEW" "sudo tar xzf /tmp/le-pitaka.tgz -C /etc/letsencrypt --skip-old-files && rm -f /tmp/le-pitaka.tgz \
      && sudo cp /etc/nginx/conf.d/pitaka.lk.conf /tmp/pitaka.lk.conf.bak 2>/dev/null; \
      sudo cp /tmp/pitaka.lk.conf /tmp/nodeid_mapping.map /etc/nginx/conf.d/ \
      && { sudo nginx -t && sudo systemctl reload nginx; } \
      || { echo 'nginx -t failed - removing the pitaka.lk vhost'; sudo rm -f /etc/nginx/conf.d/pitaka.lk.conf; \
           [ -s /tmp/pitaka.lk.conf.bak ] && sudo cp /tmp/pitaka.lk.conf.bak /etc/nginx/conf.d/pitaka.lk.conf; exit 1; }"
    echo "pitaka.lk through the new ip ($NEW_IP), before the DNS switch:"
    probe --resolve "pitaka.lk:443:$NEW_IP"
    echo "if these look right (200s, and 301s to /main/<key>), point the A record of pitaka.lk at $NEW_IP, then: dev/migrate.sh check"
    ;;
  check)
    echo "pitaka.lk resolves to: $(dig +short pitaka.lk | tr '\n' ' ')(new droplet: $NEW_IP)"
    probe
    echo "certbot renewal on $NEW (dry run) - sudo password:"
    ssh -t "$NEW" "sudo certbot renew --cert-name pitaka.lk --dry-run"
    echo "when this works, the old droplet's pitaka.lk vhost and its certbot renewal can go (sudo certbot delete --cert-name pitaka.lk there)"
    ;;
  *) sed -n '2,12p' "$0"; exit 1 ;;
esac
