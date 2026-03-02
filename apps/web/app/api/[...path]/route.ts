import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL || 'http://localhost:3003'
const API_SECRET_KEY = process.env.API_SECRET_KEY

async function proxyRequest(request: NextRequest, method: string) {
  const path = request.nextUrl.pathname
  const searchParams = request.nextUrl.search

  const headers = new Headers()
  headers.set('Content-Type', request.headers.get('Content-Type') || 'application/json')

  const cookie = request.headers.get('Cookie')
  if (cookie) {
    headers.set('Cookie', cookie)
  }

  if (API_SECRET_KEY) {
    headers.set('X-API-Key', API_SECRET_KEY)
  }

  let body: BodyInit | null = null
  if (method !== 'GET' && method !== 'HEAD') {
    const contentType = request.headers.get('Content-Type') || ''

    if (contentType.includes('multipart/form-data')) {
      body = await request.formData()
      headers.delete('Content-Type')
    } else {
      body = await request.text()
    }
  }

  const response = await fetch(`${API_URL}${path}${searchParams}`, {
    method,
    headers,
    body,
  })

  const responseHeaders = new Headers()

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      responseHeaders.append('Set-Cookie', value)
    } else if (!['transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
      responseHeaders.set(key, value)
    }
  })

  const responseBody = await response.arrayBuffer()

  return new NextResponse(responseBody, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET')
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, 'POST')
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, 'PUT')
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request, 'PATCH')
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, 'DELETE')
}

export async function OPTIONS(request: NextRequest) {
  return proxyRequest(request, 'OPTIONS')
}
