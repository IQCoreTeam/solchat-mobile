import { AppText } from '@/components/app-text'
import { useCluster } from '@/components/cluster/cluster-provider'
import { useWalletUi } from '@/components/solana/use-wallet-ui'
import { useWalletUiTheme } from '@/components/solana/use-wallet-ui-theme'
import { UiIconSymbol } from '@/components/ui/ui-icon-symbol'
import { ellipsify } from '@/utils/ellipsify'
import Clipboard from '@react-native-clipboard/clipboard'
import * as Dropdown from '@rn-primitives/dropdown-menu'
import React, { Fragment, useState } from 'react'
import { Linking, Modal, StyleSheet, TouchableOpacity, View } from 'react-native'
import { WalletUiButtonConnect } from './wallet-ui-button-connect'

function useDropdownItems({ onDisconnectPress }: { onDisconnectPress: () => void }) {
  const { getExplorerUrl } = useCluster()
  const { account } = useWalletUi()
  if (!account) {
    return []
  }
  return [
    {
      label: 'Copy Address',
      onPress: () => Clipboard.setString(account.publicKey.toString()),
    },
    {
      label: 'View in Explorer',
      onPress: async () => await Linking.openURL(getExplorerUrl(`account/${account.publicKey.toString()}`)),
    },
    {
      label: 'Disconnect',
      onPress: onDisconnectPress,
    },
  ]
}

export function WalletUiDropdown() {
  const { account, disconnect } = useWalletUi()
  const { backgroundColor, borderColor } = useWalletUiTheme()
  const [showDisconnectModal, setShowDisconnectModal] = useState(false)

  const handleDisconnect = async () => {
    setShowDisconnectModal(false)
    await disconnect()
  }

  const items = useDropdownItems({
    onDisconnectPress: () => setShowDisconnectModal(true),
  })

  if (!account || !items.length) {
    return <WalletUiButtonConnect />
  }

  return (
    <Dropdown.Root>
      <Dropdown.Trigger style={[styles.trigger, { borderColor }]}>
        <UiIconSymbol name="wallet.pass.fill" color="#000000" />
        <AppText style={{color:"#000000"}}>{ellipsify(account.publicKey.toString())}</AppText>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Overlay style={StyleSheet.absoluteFill}>
          <Dropdown.Content style={{ ...styles.list, backgroundColor, borderColor }}>
            {items.map((item, index) => (
              <Fragment key={item.label}>
                <Dropdown.Item onPress={item.onPress} style={[styles.item, { borderColor }]}>
                  <AppText>{item.label}</AppText>
                </Dropdown.Item>
                {index < items.length - 1 && <Dropdown.Separator style={{ backgroundColor: borderColor, height: 1 }} />}
              </Fragment>
            ))}
          </Dropdown.Content>
        </Dropdown.Overlay>
      </Dropdown.Portal>
      
      {/* Custom Disconnect Confirmation Modal */}
      <Modal
        visible={showDisconnectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDisconnectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#00ff00' }]}>
            <AppText style={styles.modalTitle}>Disconnect</AppText>
            <AppText style={styles.modalText}>
              {`Are you sure you want to disconnect? This will permanently destroy your account and you will have to make a new one.
NOTE: Transfer your balance\nALL SOL WILL BE LOST`}
            </AppText>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowDisconnectModal(false)}
              >
                <AppText style={styles.buttonText}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.disconnectButton]} 
                onPress={handleDisconnect}
              >
                <AppText style={[styles.buttonText, styles.disconnectButtonText]}>Disconnect</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Dropdown.Root>
  )
}

export const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    borderRadius: 0,
    borderWidth: 1,
    backgroundColor:"#15f016",
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 23,
    paddingVertical: 8,
  },
  list: {
    borderWidth: 1,
    borderRadius: 0,
    marginTop: 8,
  },
  item: {
    padding: 10,
    flexWrap: 'nowrap',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderRadius: 4,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    color: '#00ff00',
    fontFamily: 'Courier',
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    color: '#00ff00',
    fontFamily: 'Courier',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#00ff00',
  },
  disconnectButton: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#ff0000',
  },
  buttonText: {
    color: '#00ff00',
    fontFamily: 'Courier',
    fontSize: 16,
  },
  disconnectButtonText: {
    color: '#ff0000',
  },
})
