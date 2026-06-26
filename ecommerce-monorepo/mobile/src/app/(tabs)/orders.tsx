import React from 'react'
import { View } from 'react-native'
import OrderListScreen from '@/screens/OrderListScreen'

export default function OrdersTab() {
  return (
    <View style={{ flex: 1 }}>
      <OrderListScreen />
    </View>
  )
}
