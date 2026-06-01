variable "location" {
  description = "Azure region"
  type        = string
  default     = "canadacentral"
}

variable "environment" {
  description = "Environment tag"
  type        = string
  default     = "demo"
}

variable "project_name" {
  description = "Resource name prefix"
  type        = string
  default     = "neuro-echoes-architects"
}

variable "vm_size" {
  description = "CPU-only VM. Standard_B4ms (16 GiB) recommended for llama3.2 + gemma; B2ms (8 GiB) is tighter."
  type        = string
  default     = "Standard_B4ms"

  validation {
    condition = contains(
      [
        "Standard_B2ms",
        "Standard_B2s",
        "Standard_B4ms",
        "Standard_D2s_v5",
        "Standard_D4s_v5",
      ],
      var.vm_size
    )
    error_message = "Use a burstable or D-series CPU SKU (no GPU)."
  }
}

variable "admin_username" {
  description = "Linux admin user"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key" {
  description = "SSH public key (e.g. contents of ~/.ssh/id_ed25519.pub)"
  type        = string

  validation {
    condition     = length(var.ssh_public_key) > 20
    error_message = "Set ssh_public_key in terraform.tfvars (ssh-ed25519 or ssh-rsa)."
  }
}

variable "allowed_ssh_cidr" {
  description = "CIDRs allowed to SSH (use your public IP/32, not 0.0.0.0/0)"
  type        = list(string)

  validation {
    condition     = length(var.allowed_ssh_cidr) > 0 && !contains(var.allowed_ssh_cidr, "0.0.0.0/0")
    error_message = "Set allowed_ssh_cidr to your IP/32 in terraform.tfvars (open SSH to the world is blocked)."
  }
}

variable "allowed_game_cidr" {
  description = "CIDRs allowed to reach game port 8080"
  type        = list(string)

  validation {
    condition     = length(var.allowed_game_cidr) > 0 && !contains(var.allowed_game_cidr, "0.0.0.0/0")
    error_message = "Set allowed_game_cidr to your IP/32 in terraform.tfvars (open HTTP to the world is blocked)."
  }
}

variable "github_repo_url" {
  description = "Game repository to clone on the VM"
  type        = string
  default     = "https://github.com/NeuroGamingLab/Neuro-Echoes-Architects.git"
}

variable "github_branch" {
  description = "Branch to deploy"
  type        = string
  default     = "main"
}

variable "ollama_models" {
  description = "Ollama models to pull on first boot"
  type        = list(string)
  default     = ["llama3.2:latest", "gemma:latest"]
}

variable "disk_size_gb" {
  description = "OS disk size (models need space)"
  type        = number
  default     = 64
}
