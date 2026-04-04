#!/usr/bin/env python3
"""Deploy via SSH - force overwrite and deploy"""
import subprocess, sys, os, time, pty, select

HOST = "223.6.248.154"
USER = "root"
PASS = "Laogui@900327"

SCRIPT = """set -e
cd /www/wwwroot/ERP
echo "=== 1/7 停止旧服务 ==="
pm2 stop erp 2>/dev/null || true
pm2 delete erp 2>/dev/null || true
kill $(lsof -ti :3002) 2>/dev/null || true
sleep 1
echo "=== 2/7 拉取最新代码 ==="
git fetch origin main
git reset --hard origin/main
echo "=== 3/7 安装依赖 ==="
npm install
echo "=== 4/7 生成 Prisma Client ==="
npx prisma generate
echo "=== 5/7 构建项目 ==="
npm run build
echo "=== 6/7 启动服务 ==="
pm2 start node_modules/.bin/next --name "erp" -- start -p 3002
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true
echo "=== 7/7 验证服务 ==="
sleep 5
curl -s http://localhost:3002/api/health || echo "health check pending..."
echo ""
echo "=== 部署完成！访问地址: http://223.6.248.154:3002 ==="
"""

def run():
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp("ssh", [
            "ssh", "-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=/dev/null",
            "-o", "ConnectTimeout=10", "-o", "PreferredAuthentications=password,keyboard-interactive",
            "-o", "PubkeyAuthentication=no", f"{USER}@{HOST}"
        ])
    try:
        # Wait for password prompt
        buf = b""
        end_time = time.time() + 20
        while time.time() < end_time:
            r, _, _ = select.select([fd], [], [], 1.0)
            if r:
                chunk = os.read(fd, 4096)
                if chunk:
                    buf += chunk
                    sys.stdout.buffer.write(chunk); sys.stdout.buffer.flush()
                    if b"password:" in buf.lower():
                        os.write(fd, (PASS + "\n").encode())
                        break
        time.sleep(0.5)
        
        # Wait for shell prompt
        time.sleep(1)
        buf2 = os.read(fd, 4096) if select.select([fd], [], [], 2.0)[0] else b""
        if buf2:
            sys.stdout.buffer.write(buf2); sys.stdout.buffer.flush()
        
        # Send deploy script
        os.write(fd, (SCRIPT + "\n").encode())
        
        # Read output
        last_activity = time.time()
        while time.time() - last_activity < 600:
            r, _, _ = select.select([fd], [], [], 5.0)
            if r:
                try:
                    chunk = os.read(fd, 8192)
                    if not chunk:
                        print("\n[Connection closed]")
                        break
                    sys.stdout.buffer.write(chunk)
                    sys.stdout.buffer.flush()
                    last_activity = time.time()
                    if b"\xe9\x83\xa8\xe7\xbd\xb2\xe5\xae\x8c\xe6\x88\x90" in chunk:
                        time.sleep(2)
                        break
                except OSError:
                    break
        
        os.close(fd)
        _, status = os.waitpid(pid, 0)
        return os.WEXITSTATUS(status) if os.WIFEXITED(status) else 1
    except Exception as e:
        print(f"\n[ERROR] {e}")
        try: os.kill(pid, 15)
        except: pass
        return 1

if __name__ == "__main__":
    sys.exit(run())
