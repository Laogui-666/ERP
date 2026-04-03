#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
宝塔面板API部署脚本 - 华夏签证ERP系统
"""

import requests
import hashlib
import time
import json
from datetime import datetime

class BtPanelApi:
    def __init__(self, panel_url, api_key):
        self.panel_url = panel_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        self.session.verify = False  # 忽略SSL证书验证
        requests.packages.urllib3.disable_warnings()
    
    def _generate_request_token(self):
        """生成宝塔API请求令牌"""
        request_time = int(time.time())
        md5_key = hashlib.md5(self.api_key.encode('utf-8')).hexdigest()
        request_token = hashlib.md5(f"{request_time}{md5_key}".encode('utf-8')).hexdigest()
        return str(request_time), request_token
    
    def _make_request(self, action, data=None):
        """发送请求到宝塔API"""
        if data is None:
            data = {}
        
        request_time, request_token = self._generate_request_token()
        
        url = f"{self.panel_url}/public/index.php"
        params = {'action': action}
        
        post_data = {
            'request_token': request_token,
            'request_time': request_time,
        }
        post_data.update(data)
        
        print(f"  执行: {action}")
        try:
            response = self.session.post(url, params=params, data=post_data, timeout=60)
            response.raise_for_status()
            result = response.json()
            
            if result.get('status'):
                print(f"    ✓ 成功")
            else:
                print(f"    ✗ 失败: {result.get('msg', '未知错误')}")
            
            return result
        except Exception as e:
            print(f"    ✗ 请求失败: {str(e)}")
            return None

def main():
    print("=== 开始部署华夏签证ERP系统（宝塔面板API）===")
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)
    
    # 配置
    panel_url = "http://223.6.248.154:8888"  # 宝塔面板默认端口
    api_key = "wbh8MQMIVHK01iOv8csj6TtYC04jfXuW"
    project_dir = "/www/wwwroot/ERP"
    
    bt = BtPanelApi(panel_url, api_key)
    
    # 1. 先测试连接
    print("\n1. 测试宝塔面板连接...")
    result = bt._make_request('GetSystemTotal')
    if not result:
        print("✗ 无法连接到宝塔面板，请检查面板配置")
        return False
    
    # 2. 执行Shell命令部署
    print("\n2. 执行部署命令...")
    
    deploy_commands = f"""
cd {project_dir} && \
git pull origin main && \
chmod +x deploy.sh && \
./deploy.sh
"""
    
    result = bt._make_request('ExecShell', {'input': deploy_commands})
    
    if result and result.get('status'):
        print("\n" + "=" * 60)
        print("=== 部署命令已发送！===")
        print("\n部署命令执行结果:")
        print(result.get('msg', ''))
        print("\n请稍候几分钟，然后访问: http://223.6.248.154:3002")
        return True
    else:
        print("\n✗ 部署命令执行失败")
        return False

if __name__ == "__main__":
    try:
        success = main()
        if success:
            print("\n✓ 部署流程已完成！")
        else:
            print("\n✗ 部署流程失败！")
    except Exception as e:
        print(f"\n✗ 执行错误: {str(e)}")
