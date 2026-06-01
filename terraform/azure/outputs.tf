output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "public_ip" {
  description = "Public IP for SSH and game"
  value       = azurerm_public_ip.vm.ip_address
}

output "game_url" {
  description = "Open in browser (use SSH tunnel for LLM if APIs fail from remote browser)"
  value       = "http://${azurerm_public_ip.vm.ip_address}:8080"
}

output "ssh_command" {
  value = "ssh ${var.admin_username}@${azurerm_public_ip.vm.ip_address}"
}

output "ssh_tunnel_hint" {
  description = "Forward game + APIs to localhost when browser runs on your Mac"
  value       = "ssh -L 8080:127.0.0.1:8080 -L 3001:127.0.0.1:3001 -L 3002:127.0.0.1:3002 ${var.admin_username}@${azurerm_public_ip.vm.ip_address}"
}

output "vm_size" {
  value = var.vm_size
}

output "ollama_models" {
  value = var.ollama_models
}
