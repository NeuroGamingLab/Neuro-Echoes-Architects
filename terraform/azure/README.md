# Azure Terraform — Neuro Echoes of the Architects

CPU-only Ubuntu VM with Ollama (`llama3.2:latest`, `gemma:latest`) and the game stack.

## Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.5
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli): `az login`
- SSH key pair

## Quick verify (no deploy)

```bash
cd terraform/azure
chmod +x verify.sh
./verify.sh
```

Or manually:

```bash
terraform init
terraform validate -var='ssh_public_key=ssh-ed25519 AAAA...'
```

## Deploy

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit ssh_public_key and optional CIDR restrictions

terraform init
terraform plan
terraform apply
```

Outputs include `game_url` and an `ssh_tunnel_hint` (game JS calls `127.0.0.1` for Ollama/RL — use the tunnel when playing from your laptop).

## Default sizing

| SKU | RAM | Use |
|-----|-----|-----|
| `Standard_B4ms` (default) | 16 GiB | llama3.2 + gemma |
| `Standard_B2ms` | 8 GiB | llama3.2 only (tight for both) |

No GPU — `OLLAMA_NUM_GPU=0` in cloud-init.

## Security

- Set `allowed_ssh_cidr` and `allowed_game_cidr` to **your public IP/32** in `terraform.tfvars` (required; `0.0.0.0/0` is rejected).
- Do not commit `terraform.tfvars` or `*.tfstate`.
- Optional remote state: see `backend.tf.example`.
- See repo root `SECURITY.md` for API keys, CORS, and body limits.

## Destroy

```bash
terraform destroy
```
