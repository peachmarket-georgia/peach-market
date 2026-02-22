import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppWebView from '../components/AppWebView'

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <AppWebView />
    </SafeAreaView>
  )
}
