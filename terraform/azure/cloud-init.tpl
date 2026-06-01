#cloud-config
package_update: true
package_upgrade: false

write_files:
  - path: /etc/systemd/system/ollama.service.d/override.conf
    permissions: "0644"
    content: |
      [Service]
      Environment=OLLAMA_HOST=127.0.0.1:11434
      Environment=OLLAMA_NUM_GPU=0

  - path: /opt/echoes-bootstrap.sh
    permissions: "0755"
    content: |
      #!/bin/bash
      set -euo pipefail
      exec >> /var/log/echoes-bootstrap.log 2>&1
      echo "=== Echoes bootstrap $(date) ==="
      APP=/opt/echoes-architects
      MARKER=/var/lib/echoes-bootstrap.done
      if [ -f "$MARKER" ]; then echo "Already done"; exit 0; fi

      export DEBIAN_FRONTEND=noninteractive
      apt-get update -y
      apt-get install -y git curl ca-certificates python3 python3-pip

      if ! command -v node >/dev/null 2>&1; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
      fi

      if ! command -v ollama >/dev/null 2>&1; then
        curl -fsSL https://ollama.com/install.sh | sh
      fi
      mkdir -p /etc/systemd/system/ollama.service.d
      systemctl daemon-reload
      systemctl enable ollama
      systemctl restart ollama
      sleep 5

      export HOME=/root
      export OLLAMA_HOST=127.0.0.1:11434
%{ for model in ollama_models ~}
      echo "Pulling ${model} ..."
      ollama pull ${model}
%{ endfor ~}

      if [ ! -d "$APP/.git" ]; then
        git clone --branch ${github_branch} --depth 1 ${github_repo_url} "$APP"
      fi
      chown -R ${admin_username}:${admin_username} "$APP"

      cat >/etc/systemd/system/echoes-game.service <<UNIT
      [Unit]
      Description=Echoes of the Architects (proxy + RL + static server)
      After=network-online.target ollama.service
      Wants=network-online.target

      [Service]
      Type=simple
      User=${admin_username}
      WorkingDirectory=/opt/echoes-architects
      Environment=OLLAMA_MODEL=llama3.2:latest
      ExecStart=/opt/echoes-architects/scripts/run-game.sh
      Restart=on-failure
      RestartSec=15

      [Install]
      WantedBy=multi-user.target
      UNIT

      systemctl daemon-reload
      systemctl enable echoes-game.service
      systemctl restart echoes-game.service || true

      touch "$MARKER"
      echo "Bootstrap complete $(date)"

runcmd:
  - mkdir -p /etc/systemd/system/ollama.service.d
  - bash /opt/echoes-bootstrap.sh
