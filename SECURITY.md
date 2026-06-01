# Security

## Secrets and Git

- Never commit `terraform/**/terraform.tfvars`, `*.tfstate`, or `.env`.
- SSH public keys in tfstate are sensitive — use remote backend (`terraform/azure/backend.tf.example`).
- Optional API protection: set `API_KEY` on the VM; POST `/api/agent/*` and RL `/api/act` require header `X-API-Key`.

## Azure demo VM

- Restrict `allowed_ssh_cidr` and `allowed_game_cidr` to your IP/32 in `terraform.tfvars`.
- Ollama proxy and RL server listen on **127.0.0.1** only; use SSH port-forward for LLM from your laptop.
- Game HTTP is on **8080** (restricted by NSG when tfvars are set).

## Local servers

| Env | Default | Purpose |
|-----|---------|---------|
| `ALLOWED_ORIGINS` | `http://127.0.0.1:8080,http://localhost:8080` | CORS (no `*`) |
| `MAX_BODY_BYTES` | `262144` | POST body limit |
| `API_KEY` | (empty) | If set, required on POST |

## Dependencies

```bash
pip install -r requirements-ml.txt
pip audit
```
