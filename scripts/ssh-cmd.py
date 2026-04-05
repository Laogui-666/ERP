#!/usr/bin/env python3
"""Quick SSH command execution"""
import subprocess, sys, os, time, pty, select

HOST = "223.6.248.154"
USER = "root"
PASS = "Laogui@900327"

CMD = sys.argv[1] if len(sys.argv) > 1 else "echo hello"

def run():
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp("ssh", [
            "ssh", "-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=/dev/null",
            "-o", "ConnectTimeout=10", "-o", "PreferredAuthentications=password,keyboard-interactive",
            "-o", "PubkeyAuthentication=no", f"{USER}@{HOST}"
        ])
    try:
        buf = b""
        end_time = time.time() + 15
        while time.time() < end_time:
            r, _, _ = select.select([fd], [], [], 1.0)
            if r:
                chunk = os.read(fd, 4096)
                if chunk:
                    buf += chunk
                    if b"password:" in buf.lower():
                        os.write(fd, (PASS + "\n").encode())
                        break
        time.sleep(0.5)
        os.write(fd, (CMD + "\n").encode())
        time.sleep(0.3)
        os.write(fd, "exit\n".encode())
        last = time.time()
        while time.time() - last < 120:
            r, _, _ = select.select([fd], [], [], 3.0)
            if r:
                try:
                    chunk = os.read(fd, 8192)
                    if not chunk: break
                    sys.stdout.buffer.write(chunk); sys.stdout.buffer.flush()
                    last = time.time()
                except OSError: break
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
