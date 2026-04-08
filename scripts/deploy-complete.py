#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
华夏签证 ERP — 一键部署脚本 (Python版)
功能：本地代码构建 → 同步到服务器 → PM2重启 → 健康检查
"""

import sys
import os
import time
import subprocess
import tempfile
import tarfile
import io
import json

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
LOCAL_PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 排除的文件/目录（不上传）
EXCLUDE_DIRS = {
    "node_modules", ".git", ".next", ".cache",
    "__pycache__", ".trae", ".vscode", "backups"
}
EXCLUDE_EXTS = {".pyc", ".pyo", ".log"}

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

    def run(self, cmd, timeout=300):
        stdin, stdout, stderr = self.ssh.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode()
        err = stderr.read().decode()
        return (out + err).strip()

    def upload_file(self, local_path, remote_path):
        self.sftp.put(local_path, remote_path)

    def close(self):
        if self.sftp:
            self.sftp.close()
        self.ssh.close()

def get_version():
    pkg_path = os.path.join(LOCAL_PROJECT, "package.json")
    with open(pkg_path, encoding="utf-8") as f:
        return json.load(f).get("version", "0.1.0")

def check_git():
    log("检查Git状态...")
    try:
        status = subprocess.check_output(["git", "status", "--porcelain"], cwd=LOCAL_PROJECT).decode().strip()
        if status:
            warn("有未提交的变更：")
            print(status)
            response = input("是否继续？(y/n): ").strip().lower()
            if response != 'y':
                return False
        return True
    except Exception as e:
        warn(f"Git检查失败: {e}")
        return True

def git_push():
    log("推送代码到GitHub...")
    try:
        subprocess.check_call(["git", "add", "-A"], cwd=LOCAL_PROJECT)
        
        # 获取当前时间作为提交信息
        commit_msg = f"chore: deploy at {time.strftime('%Y-%m-%d %H:%M:%S')}"
        subprocess.check_call(["git", "commit", "-m", commit_msg], cwd=LOCAL_PROJECT)
        
        subprocess.check_call(["git", "push", "origin", "main"], cwd=LOCAL_PROJECT)
        ok("代码推送成功")
        return True
    except subprocess.CalledProcessError as e:
        if e.returncode == 1:
            # 可能没有变更，继续
            ok("没有变更需要提交，继续部署")
            return True
        fail(f"Git推送失败: {e}")
        return False

def deploy_via_git(d):
    log("使用Git模式部署...")
    
    log("3. 拉取最新代码...")
    result = d.run(f"cd {PROJECT_DIR} && git pull origin main")
    print(f"   {result}")
    ok("代码拉取完成")
    
    log("4. 安装依赖 (npm ci)...")
    result = d.run(f"cd {PROJECT_DIR} && npm ci --production=false 2>&1 | tail -20", timeout=300)
    print(f"   {result[-500:]}")
    ok("依赖安装完成")
    
    log("5. 生成 Prisma Client...")
    result = d.run(f"cd {PROJECT_DIR} && npx prisma generate 2>&1")
    print(f"   {result}")
    ok("Prisma Client 已生成")
    
    log("6. 构建项目 (next build)...")
    build_out = d.run(f"cd {PROJECT_DIR} && npm run build 2>&1", timeout=600)
    if "Build error" in build_out or "Failed to compile" in build_out:
        fail("构建失败")
        for line in build_out.strip().split('\n')[-30:]:
            print(f"    {line}")
        return False
    ok("构建完成")
    
    log("7. PM2 重启服务...")
    d.run(f"""
        cd {PROJECT_DIR}
        if pm2 describe {PM2_NAME} >/dev/null 2>&1; then
            pm2 restart {PM2_NAME}
        else
            pm2 start ecosystem.config.json
        fi
        pm2 save
    """)
    ok("服务已重启")
    
    return True

def health_check(d):
    log("8. 健康检查...")
    time.sleep(10)
    health = d.run(f"curl -s http://localhost:{SERVICE_PORT}/api/health 2>/dev/null")
    if 'status":"ok"' in health or '"status":"ok"' in health:
        ok("服务运行正常")
        return True
    else:
        warn(f"健康检查未通过: {health[:100]}")
        log("查看最近日志...")
        print(d.run(f"pm2 logs {PM2_NAME} --lines 15 --nostream"))
        return False

def main():
    print()
    print(f"{C.CYAN}╔══════════════════════════════════════════╗{C.RESET}")
    print(f"{C.CYAN}║   华夏签证 ERP — 一键部署               ║{C.RESET}")
    print(f"{C.CYAN}║   目标: {SERVER}:{SERVICE_PORT}                    ║{C.RESET}")
    print(f"{C.CYAN}║   模式: Git拉取 + 服务器构建             ║{C.RESET}")
    print(f"{C.CYAN}╚══════════════════════════════════════════╝{C.RESET}")
    print()

    # 检查本地环境
    log("1. 检查本地环境...")
    if not os.path.exists(os.path.join(LOCAL_PROJECT, "package.json")):
        fail(f"未找到 package.json，请在项目目录下运行此脚本")
        sys.exit(1)
    version = get_version()
    ok(f"项目版本: v{version}")

    # Git检查和推送
    if not check_git():
        sys.exit(1)
    if not git_push():
        sys.exit(1)

    d = Deployer()

    try:
        log("2. 连接服务器...")
        d.connect()
        ok("SSH 连接成功")
        
        if not deploy_via_git(d):
            d.close()
            sys.exit(1)
        
        health_ok = health_check(d)
        
        print()
        print(d.run("pm2 list"))
        print()
        print(f"{C.GREEN}╔══════════════════════════════════════════╗{C.RESET}")
        print(f"{C.GREEN}║  ✅ 部署完成！                            ║{C.RESET}")
        print(f"{C.GREEN}║  版本: v{version}                            ║{C.RESET}")
        print(f"{C.GREEN}║  访问: http://{SERVER}:{SERVICE_PORT}           ║{C.RESET}")
        if health_ok:
            print(f"{C.GREEN}║  状态: 健康检查通过                      ║{C.RESET}")
        else:
            print(f"{C.YELLOW}║  状态: 请检查服务日志                    ║{C.RESET}")
        print(f"{C.GREEN}╚══════════════════════════════════════════╝{C.RESET}")
        print()
        
    except KeyboardInterrupt:
        print(f"\n\n{C.YELLOW}⚠️  部署已取消{C.RESET}")
        d.close()
        sys.exit(1)
    except Exception as e:
        print(f"\n{C.RED}❌ 部署异常: {e}{C.RESET}")
        import traceback
        traceback.print_exc()
        d.close()
        sys.exit(1)
    finally:
        d.close()

if __name__ == "__main__":
    main()
