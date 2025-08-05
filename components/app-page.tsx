import { AppView } from '@/components/app-view'
import React, { PropsWithChildren } from 'react'
import type { ViewProps } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function AppPage({ children, ...props }: PropsWithChildren<ViewProps>) {
  return (
    <AppView style={{ flex: 1 }} {...props}>
      <SafeAreaView style={{ flex: 1, gap: 16, paddingHorizontal: 16,  backgroundColor: '#000' }}>{children}</SafeAreaView>
    </AppView>
  )
}
