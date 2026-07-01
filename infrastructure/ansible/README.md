# infrastructure/ansible

Provisioning of remote VPS for Spurro. Ansible runs **inside a Docker container** — no need to
install ansible/sshpass on the host (only Docker + Node required locally).

## Roles

- `docker` — install Docker engine + compose v2 (via `get.docker.com`, idempotent).
- `spurro_user` — create the unprivileged `spurro` system user, add it to the `docker` group,
  grant scoped passwordless sudo (`/etc/sudoers.d/spurro`).
- `amneziawg` — deploy the AmneziaWG container under `/opt/spurro/amneziawg`, owned by and run
  as `spurro`.

The playbook `playbooks/provision-server.yml` only composes roles. Add a concern = add a role
and one line there.

## Inspecting issued clients on the node

The AmneziaWG container keeps a human-readable registry of issued clients (mirror of the
app DB) so you can SSH into the node and review configs without the app:

```
docker exec amneziawg cat /opt/amnezia/awg/clients.json   # name, publicKey, clientIp, createdAt
docker exec amneziawg awg show wg0                          # live peers (rx/tx/handshake)
cat /opt/spurro/amneziawg/... ; docker exec amneziawg cat /opt/amnezia/awg/wg0.conf
```

The registry is maintained by `client-registry.sh` inside the container on add/remove.

## Build the image (once)

```
docker compose build ansible
# or: docker build -t spurro/ansible:local infrastructure/ansible/
```

## Run manually (debug)

```
docker run --rm -e ANSIBLE_HOST_KEY_CHECKING=false \
  -v "$PWD/infrastructure/ansible:/ansible:ro" -v "$PWD/vars.json:/vars.json:ro" \
  spurro/ansible:local \
  ansible-playbook -i "<IP>," -u root --extra-vars @/vars.json \
    /ansible/playbooks/provision-server.yml
```

`vars.json` (do not commit):

```json
{ "ansible_password": "<root password>", "amneziawg_port": 51820 }
```

In production these vars are pushed by the app (backend `provisionServerJob`, from the
`AMNEZIAWG_*` constants in `@spurro/shared`), not from the role defaults. The defaults in
`roles/amneziawg/defaults/main.yml` are only fallbacks for manual runs like the one above.

Target OS: Ubuntu 22.04+.
