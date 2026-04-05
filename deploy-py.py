#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
华夏签证 ERP — 一键部署脚本 (Python版)
使用 paramiko 连接服务器执行部署，无需 sshpass
"""

import sys
import time
import subprocess

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

    def connect(self):
        self.ssh.connect(SERVER, SSH_PORT, USER, PASS, timeout=15)

    def run(self, cmd, timeout=120):
        stdin, stdout, stderr = self.ssh.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode()
        err = stderr.read().decode()
        return (out + err).strip()

    def close(self):
        self.ssh.close()

def main():
    print()
    print(f"{C.CYAN}╔══════════════════════════════════════════╗{C.RESET}")
    print(f"{C.CYAN}║   华夏签证 ERP — 一键部署               ║{C.RESET}")
    print(f"{C.CYAN}║   目标: {SERVER}:{SERVICE_PORT}                    ║{C.RESET}")
    print(f"{C.CYAN}╚══════════════════════════════════════════╝{C.RESET}")
    print()

    d = Deployer()

    # 1. 连接
    log("1/7 连接服务器...")
    try:
        d.connect()
        ok("SSH 连接成功")
    except Exception as e:
        fail(f"无法连接: {e}")
        sys.exit(1)

    # 2. 拉取代码
    log("2/7 拉取最新代码...")
    result = d.run(f"cd {PROJECT_DIR} && git pull origin main")
    if any(x in result.lower() for x in ["error", "fatal", "conflict"]):
        fail(f"Git pull 失败:\n{result}")
        d.close()
        sys.exit(1)
    ok("代码已更新")
    if result and "Already up to date" not in result:
        for line in result.strip().split('\n')[:5]:
            print(f"    {line}")

    # 3. 安装依赖
    log("3/7 安装依赖 (npm ci)...")
    d.run(f"cd {PROJECT_DIR} && npm ci --production=false 2>&1 | tail -3", timeout=180)
    ok("依赖安装完成")

    # 4. 生成 Prisma Client
    log("4/7 生成 Prisma Client...")
    d.run(f"cd {PROJECT_DIR} && npx prisma generate 2>&1 | tail -3")
    ok("Prisma Client 已生成")

    # 5. 构建
    log("5/7 构建项目 (next build)...")
    build_out = d.run(f"cd {PROJECT_DIR} && npm run build 2>&1", timeout=300)
    if "Build error" in build_out or "Failed to compile" in build_out:
        fail("构建失败:")
        for line in build_out.strip().split('\n')[-20:]:
            print(f"    {line}")
        d.close()
        sys.exit(1)
    ok("构建完成")

    # 6. PM2 重启
    log("6/7 重启服务 (PM2)...")
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

    # 7. 健康检查
    log("7/7 健康检查...")
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
        sys.exit(1)
