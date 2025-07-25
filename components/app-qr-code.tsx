import React from 'react'
import QRCode from 'react-qr-code'
import { AppView } from '@/components/app-view'
import { ViewProps } from 'react-native'

export function AppQrCode({ value, style = {}, ...props }: ViewProps & { value: string }) {
  return (
    <AppView style={{marginHorizontal: 'auto', padding: 20 }} {...props}>
<QRCode value={encodeURIComponent(value)} bgColor="#1a1a1a" fgColor="#13eb15" />

    </AppView>
  )
}


