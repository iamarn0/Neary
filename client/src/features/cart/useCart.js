import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartApi } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export function useCart() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [conflict, setConflict] = useState(null)
  const enabled = user?.role === 'CUSTOMER'

  const query = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
    enabled,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['cart'] })

  const add = useMutation({
    mutationFn: (payload) => cartApi.add(payload),
    onSuccess: () => {
      refresh()
      toast.success('Added to cart')
    },
    onError: (error, payload) => {
      if (error.code === 'CART_SHOP_CONFLICT') {
        setConflict({ payload, currentShop: error.details?.currentShop, nextShop: error.details?.nextShop })
      } else toast.error(error.message)
    },
  })

  const update = useMutation({
    mutationFn: ({ productId, quantity }) => cartApi.update(productId, quantity),
    onSuccess: refresh,
    onError: (error) => toast.error(error.message),
  })

  const clear = useMutation({
    mutationFn: cartApi.clear,
    onSuccess: refresh,
  })

  async function clearAndAdd() {
    if (!conflict) return
    await cartApi.clear()
    await cartApi.add(conflict.payload)
    setConflict(null)
    refresh()
    toast.success('Cart updated')
  }

  return { query, add, update, clear, conflict, setConflict, clearAndAdd, enabled }
}
