'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { liquidSpringConfig, serviceCardHover } from '@design-system/theme/animations'
import { LiquidCard } from '@design-system/components/liquid-card'
import { LiquidButton } from '@design-system/components/liquid-button'

interface ToolShowcaseProps {
  id?: string;
}

// 智能服务 - 参考Panda002
const services = [
  {
    id: 1,
    name: '行程规划',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    description: '智能规划您的旅行路线',
    status: 'coming_soon',
    color: 'from-morandi-ocean to-morandi-mist',
    iconBg: 'bg-morandi-ocean',
  },
  {
    id: 2,
    name: '签证评估',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    description: 'AI 评估您的签证通过率',
    status: 'coming_soon',
    color: 'from-morandi-sand to-morandi-clay',
    iconBg: 'bg-morandi-sand',
  },
  {
    id: 3,
    name: '证件照制作',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
    description: '一键生成各国签证标准证件照',
    href: '/portal/tools/photo',
    status: 'new',
    color: 'from-morandi-ocean to-morandi-blush',
    iconBg: 'bg-morandi-ocean',
  },
  {
    id: 4,
    name: '表格填写助手',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    description: '智能填写签证申请表格',
    href: '/portal/tools/form',
    status: 'new',
    color: 'from-morandi-ocean to-morandi-deep',
    iconBg: 'bg-morandi-ocean',
  },
  {
    id: 5,
    name: '汇率换算',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    description: '实时汇率查询与换算',
    href: '/portal/tools/exchange',
    status: 'new',
    color: 'from-morandi-ocean to-morandi-deep',
    iconBg: 'bg-morandi-ocean',
  },
  {
    id: 6,
    name: '行程规划',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: '智能生成签证行程单',
    href: '/portal/tools/itinerary',
    status: 'new',
    color: 'from-morandi-mist to-morandi-ocean',
    iconBg: 'bg-morandi-mist',
  },
];

export function ToolShowcase({ id }: ToolShowcaseProps) {
  const handleServiceClick = (feature: string, href?: string) => {
    if (href) {
      window.location.href = href;
    } else {
      alert(`${feature}功能正在开发中，敬请期待！`);
    }
  };

  return (
    <section id={id} className="py-12 -mt-4 bg-gradient-to-br from-slate-50 via-morandi-cream to-morandi-blush/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...liquidSpringConfig.medium }}
        >
          <h2 className="text-xl md:text-2xl font-semibold text-morandi-deep">
            选择您需要的服务
          </h2>
        </motion.div>
        
        {/* 服务卡片网格 */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...liquidSpringConfig.gentle, delay: index * 0.1 }}
              className="group"
            >
              {service.href ? (
                <Link href={service.href}>
                  <div className="h-full p-6 rounded-glass-lg glass-card shadow-glass-medium text-center transition-all duration-200 hover:-translate-y-2 hover:shadow-glass-strong glass-card-hover">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-glass-sm bg-gradient-to-br from-glass-primary/15 to-glass-secondary/10 transition-transform duration-200 group-hover:scale-110">
                      {service.icon}
                    </div>
                    <h3 className="text-base font-semibold text-glass-text-primary mb-1">
                      {service.name}
                    </h3>
                    <p className="text-xs text-glass-text-muted leading-relaxed">
                      {service.description}
                    </p>
                    {service.status === 'new' && (
                      <span className="absolute top-3 right-3 text-[10px] bg-morandi-ocean text-white px-2 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                    {service.status === 'coming_soon' && (
                      <span className="absolute top-3 right-3 text-[10px] bg-gray-300 text-gray-600 px-2 py-0.5 rounded-full">
                        即将上线
                      </span>
                    )}
                  </div>
                </Link>
              ) : (
                <div 
                  className="h-full p-6 rounded-glass-lg glass-card shadow-glass-medium text-center transition-all duration-200 hover:-translate-y-2 hover:shadow-glass-strong glass-card-hover cursor-pointer"
                  onClick={() => handleServiceClick(service.name)}
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-glass-sm bg-gradient-to-br from-glass-primary/15 to-glass-secondary/10 transition-transform duration-200 group-hover:scale-110">
                    {service.icon}
                  </div>
                  <h3 className="text-base font-semibold text-glass-text-primary mb-1">
                    {service.name}
                  </h3>
                  <p className="text-xs text-glass-text-muted leading-relaxed">
                    {service.description}
                  </p>
                  {service.status === 'new' && (
                    <span className="absolute top-3 right-3 text-[10px] bg-morandi-ocean text-white px-2 py-0.5 rounded-full">
                      NEW
                    </span>
                  )}
                  {service.status === 'coming_soon' && (
                    <span className="absolute top-3 right-3 text-[10px] bg-gray-300 text-gray-600 px-2 py-0.5 rounded-full">
                      即将上线
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
        
        {/* 更多服务按钮 */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...liquidSpringConfig.medium, delay: 0.5 }}
        >
          <LiquidButton
            variant="liquid"
            size="md"
            href="/portal/tools"
          >
            更多服务
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </LiquidButton>
        </motion.div>
      </div>
    </section>
  )
}
