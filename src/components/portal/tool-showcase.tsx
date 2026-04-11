'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { liquidSpringConfig, serviceCardHover } from '@design-system/theme/animations'
import { LiquidCard } from '@design-system/components/liquid-card'

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

export function ToolShowcase() {
  const handleServiceClick = (feature: string, href?: string) => {
    if (href) {
      window.location.href = href;
    } else {
      alert(`${feature}功能正在开发中，敬请期待！`);
    }
  };

  return (
    <section className="py-12 -mt-4 bg-gradient-to-br from-slate-50 via-morandi-cream to-morandi-blush">
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
              transition={{ ...liquidSpringConfig.medium, delay: index * 0.08 }}
              whileHover={serviceCardHover.whileHover}
              whileTap={serviceCardHover.whileTap}
            >
              {service.href ? (
                <Link href={service.href}>
                  <LiquidCard
                    variant="liquid"
                    liquidIntensity="medium"
                    padding="sm"
                    hoverable
                    className="h-full cursor-pointer text-center group relative overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    <div className="relative">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 ${service.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-lg ${service.iconBg}/30 group-hover:scale-110 transition-transform duration-300`}>
                        {service.icon}
                      </div>
                    </div>
                    
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-morandi-deep mb-1 sm:mb-2 relative z-10">
                      {service.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-morandi-mist relative z-10">
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
                  </LiquidCard>
                </Link>
              ) : (
                <LiquidCard
                  variant="liquid"
                  liquidIntensity="medium"
                  padding="sm"
                  hoverable
                  className="h-full cursor-pointer text-center group relative overflow-hidden"
                  onClick={() => handleServiceClick(service.name)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  <div className="relative">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 ${service.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-lg ${service.iconBg}/30 group-hover:scale-110 transition-transform duration-300`}>
                      {service.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-morandi-deep mb-1 sm:mb-2 relative z-10">
                    {service.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-morandi-mist relative z-10">
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
                </LiquidCard>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
