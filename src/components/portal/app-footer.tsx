'use client'

import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'

export function AppFooter() {
  return (
    <footer className="relative glass-navbar border-t border-glass-border-light glass-footer-animate">
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-8 md:py-10">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* 左侧：品牌信息 */}
          <motion.div 
            className="w-full md:w-1/4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={liquidSpringConfig.gentle}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-glass-sm bg-gradient-to-br from-glass-primary to-glass-secondary flex items-center justify-center">
                <span className="text-base">🌏</span>
              </div>
              <h3 className="text-base font-bold text-glass-text-primary glass-text-gradient">华夏签证</h3>
            </div>
            <p className="text-sm text-glass-text-muted leading-relaxed">
              专业签证，一站搞定
            </p>
            <div className="mt-3 flex gap-2">
              {['微信', '微博'].map((name) => (
                <div key={name} className="flex h-8 w-8 items-center justify-center rounded-glass-sm glass-card text-xs text-glass-text-muted hover:bg-glass-bg-card transition-colors cursor-pointer">
                  {name[0]}
                </div>
              ))}
            </div>
          </motion.div>

          {/* 中间：导航链接 */}
          <motion.div 
            className="w-full md:w-2/4 grid grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...liquidSpringConfig.gentle, delay: 0.1 }}
          >
            {/* 签证代办 */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-glass-text-muted mb-3">签证代办</h4>
              <ul className="space-y-2">
                {['申根签证', '美国签证', '日本签证', '韩国签证', '英国签证'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-glass-text-primary/80 hover:text-glass-primary transition-colors cursor-pointer hover:translate-x-0.5 inline-block">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 智能工具 */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-glass-text-muted mb-3">智能工具</h4>
              <ul className="space-y-2">
                {['签证资讯', '行程助手', '申请表助手', '签证评估', '翻译助手'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-glass-text-primary/80 hover:text-glass-primary transition-colors cursor-pointer hover:translate-x-0.5 inline-block">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 关于 */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-glass-text-muted mb-3">关于</h4>
              <ul className="space-y-2">
                {['关于我们', '联系方式', '隐私政策', '服务条款'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-glass-text-primary/80 hover:text-glass-primary transition-colors cursor-pointer hover:translate-x-0.5 inline-block">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* 右侧：店铺二维码 */}
          <motion.div 
            className="w-full md:w-1/4 flex justify-center md:justify-end"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...liquidSpringConfig.gentle, delay: 0.2 }}
          >
            <div className="flex flex-col items-center">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-glass-text-muted mb-3 text-center">店铺二维码</h4>
              <div className="flex gap-4">
                {/* 二维码1 */}
                <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-sm text-glass-text-muted">二维码</span>
                </div>
                {/* 二维码2 */}
                <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-sm text-glass-text-muted">二维码</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 底部版权 */}
        <motion.div 
          className="mt-8 pt-4 glass-divider text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ ...liquidSpringConfig.gentle, delay: 0.3 }}
        >
          <p className="text-xs text-glass-text-muted">
            © 2026 华夏签证 · 专业签证，一站搞定
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
