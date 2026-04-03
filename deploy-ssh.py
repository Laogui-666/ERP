#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SSH部署脚本 - 华夏签证ERP系统
"""

import paramiko
import time
from datetime import datetime

def deploy_to_server():
    # 服务器配置
    host = "223.6.248.154"
    port = 22
    username = "root"
    password = "Laogui@900327"
    project_dir = "/www/wwwroot/ERP"
    
    print(f"=== 开始部署华夏签证ERP系统 ===")
    print(f"目标服务器: {host}:{port}")
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 50)
    
    # 创建SSH客户端
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # 连接服务器
        print("1. 连接服务器...")
        ssh.connect(hostname=host, port=port, username=username, password=password)
        print("   ✓ 服务器连接成功")
        
        # 执行命令的函数
        def execute_command(command):
            print(f"   $ {command}")
            stdin, stdout, stderr = ssh.exec_command(command)
            output = stdout.read().decode('utf-8')
            error = stderr.read().decode('utf-8')
            if output:
                print(f"   {output}")
            if error:
                print(f"   错误: {error}")
            return output, error
        
        # 1. 进入项目目录并拉取代码
        print("\n2. 拉取最新代码...")
        execute_command(f"cd {project_dir} && git pull origin main")
        
        # 2. 设置部署脚本权限
        print("\n3. 设置脚本权限...")
        execute_command(f"cd {project_dir} && chmod +x deploy.sh")
        
        # 3. 执行部署脚本
        print("\n4. 执行部署脚本...")
        print("   (这可能需要几分钟，请耐心等待...)")
        execute_command(f"cd {project_dir} && ./deploy.sh")
        
        # 4. 检查服务状态
        print("\n5. 检查服务状态...")
        time.sleep(10)  # 等待服务启动
        output, _ = execute_command("curl -s http://localhost:3002/api/health")
        
        print("\n" + "=" * 50)
        print("=== 部署完成！===")
        print("访问地址: http://223.6.248.154:3002")
        print(f"健康检查: {output.strip() if output else '未响应'}")
        
    except Exception as e:
        print(f"\n✗ 部署失败: {str(e)}")
        return False
    finally:
        # 关闭连接
        ssh.close()
        print("\n✓ SSH连接已关闭")
    
    return True

if __name__ == "__main__":
    try:
        success = deploy_to_server()
        if success:
            print("\n✓ 部署流程已完成！")
        else:
            print("\n✗ 部署流程失败！")
    except Exception as e:
        print(f"\n✗ 执行错误: {str(e)}")
