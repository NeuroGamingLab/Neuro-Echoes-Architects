#!/usr/bin/env bash
# Local Terraform checks only (no Azure apply).
set -euo pipefail
cd "$(dirname "$0")"

PLACEHOLDER_KEY='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHRlcnJhZm9ybS12YWxpZGF0ZS1wbGFjZWhvbGRlcmtleQ=='

echo "==> terraform fmt -check"
terraform fmt -check -recursive || { terraform fmt -recursive; exit 1; }

echo "==> terraform init"
terraform init -input=false

echo "==> terraform validate"
export TF_VAR_ssh_public_key="${TF_VAR_ssh_public_key:-$PLACEHOLDER_KEY}"
export TF_VAR_allowed_ssh_cidr='["203.0.113.10/32"]'
export TF_VAR_allowed_game_cidr='["203.0.113.10/32"]'
terraform validate

echo ""
echo "OK: fmt + init + validate passed."
echo "Next: cp terraform.tfvars.example terraform.tfvars, set ssh_public_key, then:"
echo "  az login"
echo "  terraform plan"
echo "  terraform apply"
