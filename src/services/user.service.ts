import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { AppError, DEFAULT_PAGE_SIZE } from '@/types/api'
import type { JwtPayload } from '@/lib/auth'
import type { UserRole } from '@/types/user'

export class UserService {
  async list(
    user: JwtPayload,
    query: { page?: number; pageSize?: number; role?: UserRole; departmentId?: string; search?: string },
  ) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, 100)
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {
      companyId: user.companyId,
    }

    if (query.role) {
      where.role = query.role
    }
    if (query.departmentId) {
      where.departmentId = query.departmentId
    }
    if (query.search) {
      where.OR = [
        { username: { contains: query.search } },
        { realName: { contains: query.search } },
        { phone: { contains: query.search } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          realName: true,
          phone: true,
          email: true,
          role: true,
          departmentId: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          department: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    return {
      data: users,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    }
  }

  async getById(id: string, user: JwtPayload) {
    const found = await prisma.user.findFirst({
      where: { id, companyId: user.companyId },
      select: {
        id: true,
        username: true,
        realName: true,
        phone: true,
        email: true,
        role: true,
        departmentId: true,
        companyId: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        department: { select: { id: true, name: true, code: true } },
      },
    })

    if (!found) {
      throw new AppError('USER_NOT_FOUND', '用户不存在', 404)
    }

    return found
  }

  async create(
    data: {
      username: string
      password: string
      realName: string
      phone?: string
      email?: string
      role: UserRole
      departmentId?: string
    },
    user: JwtPayload,
  ) {
    // Check duplicate
    const existing = await prisma.user.findUnique({
      where: { username: data.username },
    })

    if (existing) {
      throw new AppError('USERNAME_EXISTS', '用户名已存在', 400)
    }

    const passwordHash = await hash(data.password, 10)

    return prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        realName: data.realName,
        phone: data.phone ?? null,
        email: data.email ?? null,
        role: data.role,
        departmentId: data.departmentId ?? null,
        companyId: user.companyId,
      },
      select: {
        id: true,
        username: true,
        realName: true,
        phone: true,
        email: true,
        role: true,
        departmentId: true,
        isActive: true,
        createdAt: true,
      },
    })
  }

  async update(
    id: string,
    data: {
      realName?: string
      phone?: string
      email?: string
      role?: UserRole
      departmentId?: string
      isActive?: boolean
    },
    user: JwtPayload,
  ) {
    const found = await prisma.user.findFirst({
      where: { id, companyId: user.companyId },
    })

    if (!found) {
      throw new AppError('USER_NOT_FOUND', '用户不存在', 404)
    }

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        realName: true,
        phone: true,
        email: true,
        role: true,
        departmentId: true,
        isActive: true,
        updatedAt: true,
      },
    })
  }

  async resetPassword(id: string, newPassword: string, user: JwtPayload) {
    const found = await prisma.user.findFirst({
      where: { id, companyId: user.companyId },
    })

    if (!found) {
      throw new AppError('USER_NOT_FOUND', '用户不存在', 404)
    }

    const passwordHash = await hash(newPassword, 10)

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    })
  }
}

export const userService = new UserService()
