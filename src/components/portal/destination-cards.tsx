'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { liquidSpringConfig, destinationCardHover } from '@design-system/theme/animations'

// 模拟热门目的地数据 - 参考Panda002
const destinations = [
  {
    id: 1,
    name: '日本',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
    visaType: '电子签',
    price: '¥599',
    description: '樱花之国，现代与传统完美融合',
  },
  {
    id: 2,
    name: '韩国',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800&q=80',
    visaType: '电子签',
    price: '¥399',
    description: '时尚之都，潮流与美食并存',
  },
  {
    id: 3,
    name: '申根',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
    visaType: '申根签',
    price: '¥358',
    description: '浪漫之都，品味多元文化',
  },
  {
    id: 4,
    name: '英国',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
    visaType: '标准签',
    price: '¥1299',
    description: '日不落帝国，绅士与文化的殿堂',
  },
  {
    id: 5,
    name: '澳大利亚',
    image: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&q=80',
    visaType: '电子签',
    price: '¥1399',
    description: '神奇大陆自然之美',
  },
  {
    id: 6,
    name: '加拿大',
    image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80',
    visaType: '电子签',
    price: '¥1099',
    description: '枫叶之国，壮美自然风光',
  },
  {
    id: 7,
    name: '美国',
    image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&q=80',
    visaType: '十年签',
    price: '¥1599',
    description: '自由之地，梦想与机遇之城',
  },
  {
    id: 8,
    name: '泰国',
    image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80',
    visaType: '落地签',
    price: '¥299',
    description: '微笑之国，海岛风情等你探索',
  },
];

export function DestinationCards() {
  return (
    <section className="py-12 relative overflow-hidden">
      <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={liquidSpringConfig.medium}
        >
          <h2 className="text-xl md:text-2xl font-semibold text-morandi-deep">
            热门目的地
          </h2>
        </motion.div>
        
        {/* 国家卡片网格 - 5栏布局 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 max-w-6xl mx-auto">
          {destinations.map((dest, index) => (
            <Link href={`/services?destination=${dest.id}`} key={dest.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...liquidSpringConfig.medium, delay: index * 0.1 }}
                whileHover={destinationCardHover.whileHover}
                whileTap={destinationCardHover.whileTap}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer"
              >
                {/* 图片区域 - 占2/3 */}
                <div className="relative h-20 md:h-24 overflow-hidden">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-3 text-white font-bold text-base md:text-lg">
                    {dest.name}
                  </div>
                </div>
                {/* 信息区域 - 占1/3 */}
                <div className="p-2 md:p-3 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] md:text-xs bg-morandi-ocean/10 text-morandi-ocean px-2 py-0.5 rounded-full">
                      {dest.visaType}
                    </span>
                    <span className="text-xs md:text-sm font-bold text-morandi-deep">
                      {dest.price}
                    </span>
                  </div>
                  <p className="text-[10px] md:text-xs text-morandi-mist truncate">
                    {dest.description}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
