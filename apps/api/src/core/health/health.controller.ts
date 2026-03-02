import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { PrismaService } from '../database/prisma.service'
import { SkipApiKey } from '../guards/api-key.guard'

type HealthStatus = {
  status: 'ok' | 'error'
  timestamp: string
  uptime: number
  version: string
  checks: {
    database: 'healthy' | 'unhealthy'
    memory: {
      heapUsed: string
      heapTotal: string
      rss: string
    }
  }
}

@ApiTags('health')
@Controller('health')
@SkipApiKey()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check(): Promise<HealthStatus> {
    const memoryUsage = process.memoryUsage()

    let dbStatus: 'healthy' | 'unhealthy' = 'unhealthy'
    try {
      await this.prisma.$queryRaw`SELECT 1`
      dbStatus = 'healthy'
    } catch {
      dbStatus = 'unhealthy'
    }

    return {
      status: dbStatus === 'healthy' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.0.1',
      checks: {
        database: dbStatus,
        memory: {
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        },
      },
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  live(): { status: 'ok' } {
    return { status: 'ok' }
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready(): Promise<{ status: 'ok' | 'error'; database: boolean }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'ok', database: true }
    } catch {
      return { status: 'error', database: false }
    }
  }
}
