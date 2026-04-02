import { PublicNavbar } from '@/components/public/public-navbar'
import { PublicHomePage } from '@/components/public/public-home-page'
import { DynamicBackground } from '@shared/ui/dynamic-bg'

/**
 * 根路径首页 — 华夏签证品牌门户
 *
 * 统一入口设计：
 * - 未登录用户：显示品牌首页，可浏览服务、注册/登录
 * - 已登录用户：同样显示品牌首页，通过右上角账号面板进入后台
 *
 * 后台入口位置：
 * - 右上角头像/用户名区域点击
 * - 根据用户角色跳转到对应页面
 */
export default function HomePage() {
  return (
    <>
      <DynamicBackground />
      <PublicNavbar />
      <PublicHomePage />
    </>
  )
}
