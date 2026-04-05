#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
华夏签证 ERP — 一键部署脚本 (Python版)
功能：本地代码构建 → 同步到服务器 → PM2重启 → 健康检查
支持两种模式：
  rsync模式(默认): 本地构建后同步到服务器
  ssh模式: 直接在服务器上git pull+构建(需服务器能访问GitHub)
"""

import sys
import os
import time
import subprocess
import tempfile
import tarfile
import io

# 自动安装 paramiko
try:
    import paramiko
except ImportError:
    print("正在安装 paramiko...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q", "--break-system-packages"])
    import paramiko

# ========== 配置 ==========
SERVER = "223.6.248.154"
SSH_PORT = 22
USER = "root"
PASS = "Laogui@900327"
PROJECT_DIR = "/www/wwwroot/ERP"
SERVICE_PORT = 3002
PM2_NAME = "erp"
LOCAL_PROJECT = os.path.dirname(os.path.abspath(__file__))

# 排除的文件/目录（不上传）
EXCLUDE_DIRS = {
    "node_modules", ".git", ".next", ".cache",
    "__pycache__", ".trae", ".vscode", "backups"
}
EXCLUDE_EXTS = {".pyc", ".pyo"}

# ========== 颜色 ==========
class C:
    RED    = "\033[0;31m"
    GREEN  = "\033[0;32m"
    YELLOW = "\033[1;33m"
    CYAN   = "\033[0;36m"
    RESET  = "\033[0m"

def log(msg):  print(f"{C.CYAN}[{time.strftime('%H:%M:%S')}]{C.RESET} {msg}")
def ok(msg):   print(f"{C.GREEN}  ✅ {msg}{C.RESET}")
def warn(msg): print(f"{C.YELLOW}  ⚠️  {msg}{C.RESET}")
def fail(msg): print(f"{C.RED}  ❌ {msg}{C.RESET}")

class Deployer:
    def __init__(self):
        self.ssh = paramiko.SSHClient()
        self.ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        self.sftp = None

    def connect(self):
        self.ssh.connect(SERVER, SSH_PORT, USER, PASS, timeout=15)
        self.sftp = self.ssh.open_sftp()

    def run(self, cmd, timeout=120):
        stdin, stdout, stderr = self.ssh.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode()
        err = stderr.read().decode()
        return (out + err).strip()

    def upload_file(self, local_path, remote_path):
        """上传单个文件"""
        self.sftp.put(local_path, remote_path)

    def upload_tar(self, local_dir, remote_dir):
        """打包本地目录并上传解压（比逐文件快100倍）"""
        log("  打包项目文件...")
        buf = io.BytesIO()
        with tarfile.open(fileobj=buf, mode='w:gz') as tar:
            for root, dirs, files in os.walk(local_dir):
                # 排除目录
                dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
                for f in files:
                    if any(f.endswith(ext) for ext in EXCLUDE_EXTS):
                        continue
                    full = os.path.join(root, f)
                    arcname = os.path.relpath(full, local_dir)
                    tar.add(full, arcname)

        buf.seek(0)
        size_mb = len(buf.getvalue()) / 1024 / 1024
        log(f"  上传压缩包 ({size_mb:.1f} MB)...")

        # 上传到服务器
        remote_tar = "/tmp/erp-deploy.tar.gz"
        with self.sftp.open(remote_tar, 'wb') as f:
            f.write(buf.getvalue())

        # 在服务器上解压
        log("  解压到服务器...")
        self.run(f"mkdir -p {remote_dir} && tar -xzf {remote_tar} -C {remote_dir}")
        self.run(f"rm -f {remote_tar}")

    def close(self):
        if self.sftp:
            self.sftp.close()
        self.ssh.close()

def get_version():
    """读取本地 package.json 版本"""
    import json
    pkg_path = os.path.join(LOCAL_PROJECT, "package.json")
    with open(pkg_path) as f:
        return json.load(f).get("version", "0.1.0")

def main():
    print()
    print(f"{C.CYAN}╔══════════════════════════════════════════╗{C.RESET}")
    print(f"{C.CYAN}║   华夏签证 ERP — 一键部署               ║{C.RESET}")
    print(f"{C.CYAN}║   目标: {SERVER}:{SERVICE_PORT}                    ║{C.RESET}")
    print(f"{C.CYAN}║   模式: 本地构建 + 同步部署             ║{C.RESET}")
    print(f"{C.CYAN}╚══════════════════════════════════════════╝{C.RESET}")
    print()

    d = Deployer()

    # 1. 连接
    log("1/8 连接服务器...")
    try:
        d.connect()
        ok("SSH 连接成功")
    except Exception as e:
        fail(f"无法连接: {e}")
        sys.exit(1)

    # 2. 检查本地环境
    log("2/8 检查本地环境...")
    if not os.path.exists(os.path.join(LOCAL_PROJECT, "package.json")):
        fail(f"未找到 package.json，请在项目目录下运行此脚本")
        d.close()
        sys.exit(1)
    version = get_version()
    ok(f"项目版本: {version}")

    # 3. 上传项目文件
    log("3/8 同步项目文件到服务器...")
    d.upload_tar(LOCAL_PROJECT, PROJECT_DIR)
    ok("文件同步完成")

    # 4. 安装依赖
    log("4/8 安装依赖 (npm ci)...")
    d.run(f"cd {PROJECT_DIR} && npm ci --production=false 2>&1 | tail -3", timeout=180)
    ok("依赖安装完成")

    # 5. 生成 Prisma Client
    log("5/8 生成 Prisma Client...")
    d.run(f"cd {PROJECT_DIR} && npx prisma generate 2>&1 | tail -3")
    ok("Prisma Client 已生成")

    # 6. 构建
    log("6/8 构建项目 (next build)...")
    build_out = d.run(f"cd {PROJECT_DIR} && npm run build 2>&1", timeout=300)
    if "Build error" in build_out or "Failed to compile" in build_out:
        fail("构建失败:")
        for line in build_out.strip().split('\n')[-20:]:
            print(f"    {line}")
        d.close()
        sys.exit(1)
    ok("构建完成")

    # 7. PM2 重启
    log("7/8 重启服务 (PM2)...")
    d.run(f"""
        cd {PROJECT_DIR}
        if pm2 describe {PM2_NAME} &>/dev/null; then
            pm2 restart {PM2_NAME}
        else
            pm2 start ecosystem.config.json
        fi
        pm2 save
    """)
    ok("服务已重启")

    # 8. 健康检查
    log("8/8 健康检查...")
    time.sleep(8)
    health = d.run(f"curl -s http://localhost:{SERVICE_PORT}/api/health 2>/dev/null")
    if '"status":"ok"' in health:
        ok("服务运行正常")
    else:
        warn(f"健康检查未通过: {health[:100]}")
        log("查看最近日志...")
        print(d.run(f"pm2 logs {PM2_NAME} --lines 5 --nostream"))

    # 输出状态
    print()
    print(d.run("pm2 list"))
    print()
    print(f"{C.GREEN}╔══════════════════════════════════════════╗{C.RESET}")
    print(f"{C.GREEN}║  ✅ 部署完成！                            ║{C.RESET}")
    print(f"{C.GREEN}║  版本: v{version}                            ║{C.RESET}")
    print(f"{C.GREEN}║  访问: http://{SERVER}:{SERVICE_PORT}              ║{C.RESET}")
    print(f"{C.GREEN}╚══════════════════════════════════════════╝{C.RESET}")
    print()

    d.close()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  部署已取消")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 部署异常: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
