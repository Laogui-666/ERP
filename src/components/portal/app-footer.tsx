'use client'

import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'

export function AppFooter() {
  return (
    <footer className="relative border-t border-liquid-ocean/10 bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* 品牌 */}
          <motion.div 
            className="col-span-2 md:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={liquidSpringConfig.gentle}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-liquid-ocean to-liquid-oceanLight flex items-center justify-center">
                <span className="text-base">🌏</span>
              </div>
              <h3 className="text-base font-bold text-liquid-deep">华夏签证</h3>
            </div>
            <p className="text-sm text-liquid-mist leading-relaxed">
              专业签证，一站搞定
            </p>
            <div className="mt-4 flex gap-3">
              {['微信', '微博'].map((name) => (
                <div key={name} className="flex h-9 w-9 items-center justify-center rounded-xl bg-liquid-ocean/5 border border-liquid-ocean/10 text-xs text-liquid-mist hover:bg-liquid-ocean/10 transition-colors cursor-pointer">
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
            <h4 className="text-xs font-semibold uppercase tracking-wider text-liquid-mist mb-4">签证服务</h4>
            <ul className="space-y-3">
              {['申根签证', '美国签证', '日本签证', '韩国签证', '泰国签证'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-liquid-deep/80 hover:text-liquid-ocean transition-colors cursor-pointer hover:translate-x-0.5 inline-block">
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
            <h4 className="text-xs font-semibold uppercase tracking-wider text-liquid-mist mb-4">智能工具</h4>
            <ul className="space-y-3">
              {['签证资讯', '行程助手', '申请表助手', '签证评估', '翻译助手'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-liquid-deep/80 hover:text-liquid-ocean transition-colors cursor-pointer hover:translate-x-0.5 inline-block">
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
            <h4 className="text-xs font-semibold uppercase tracking-wider text-liquid-mist mb-4">关于</h4>
            <ul className="space-y-3">
              {['关于我们', '联系方式', '隐私政策', '服务条款'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-liquid-deep/80 hover:text-liquid-ocean transition-colors cursor-pointer hover:translate-x-0.5 inline-block">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* 底部版权 */}
        <motion.div 
          className="mt-12 pt-8 border-t border-liquid-ocean/10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ ...liquidSpringConfig.gentle, delay: 0.4 }}
        >
          <p className="text-xs text-liquid-mist">
            © 2026 华夏签证 · 专业签证，一站搞定
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
