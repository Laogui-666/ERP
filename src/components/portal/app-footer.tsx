'use client'

import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'

export function AppFooter() {
  return (
    <footer className="relative glass-navbar border-t border-glass-border-light glass-footer-animate">
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-6 md:py-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* 品牌 */}
          <motion.div 
            className="col-span-2 md:col-span-1"
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

          {/* 签证服务 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...liquidSpringConfig.gentle, delay: 0.1 }}
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider text-glass-text-muted mb-3">签证服务</h4>
            <ul className="space-y-2">
              {['申根签证', '美国签证', '日本签证', '韩国签证', '泰国签证'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-glass-text-primary/80 hover:text-glass-primary transition-colors cursor-pointer hover:translate-x-0.5 inline-block">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* 智能工具 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...liquidSpringConfig.gentle, delay: 0.2 }}
          >
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
          </motion.div>

          {/* 关于我们 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...liquidSpringConfig.gentle, delay: 0.3 }}
          >
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
          </motion.div>
        </div>

        {/* 底部版权 */}
        <motion.div 
          className="mt-6 pt-4 glass-divider text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ ...liquidSpringConfig.gentle, delay: 0.4 }}
        >
          <p className="text-xs text-glass-text-muted">
            © 2026 华夏签证 · 专业签证，一站搞定
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
