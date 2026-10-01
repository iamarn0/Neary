import { io } from 'socket.io-client'

let socket

export function getSocket() {
  const token = localStorage.getItem('neare.token')
  if (!token) return null
  if (!socket) {
    socket = io({ auth: { token } })
  }
  return socket
}

export function resetSocket() {
  socket?.disconnect()
  socket = null
}
