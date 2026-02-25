'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  isReconnecting: boolean
  connect: () => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isReconnecting: false,
  connect: () => {},
})

export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

  const connect = useCallback(() => {
    if (socket && !socket.connected) {
      socket.connect()
    }
  }, [socket])

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'
    const socketInstance = io(`${API_URL}/chat`, {
      transports: ['websocket'],
      autoConnect: true,
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id)
      setIsConnected(true)
      setIsReconnecting(false)
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    socketInstance.on('reconnect_attempt', () => {
      setIsReconnecting(true)
    })

    socketInstance.on('reconnect_failed', () => {
      setIsReconnecting(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected, isReconnecting, connect }}>{children}</SocketContext.Provider>
  )
}
