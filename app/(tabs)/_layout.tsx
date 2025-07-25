import { UiIconSymbol } from '@/components/ui/ui-icon-symbol'
import { Ionicons } from '@expo/vector-icons';

import { Tabs } from 'expo-router'
import React from 'react'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {/* The index redirects to the account screen */}
      <Tabs.Screen name="index" options={{ tabBarItemStyle: { display: 'none' } }} />
       <Tabs.Screen
              name="chat"
              options={{
 tabBarLabel: '',
         tabBarActiveTintColor: '#00ff22',
             tabBarInactiveTintColor: '#666666',
                tabBarIcon: ({ color }) =>  <Ionicons name="chatbubble-ellipses" size={25} color={color} />,
              }}
            />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
           tabBarLabel: '',
                    tabBarActiveTintColor: '#00ff22',
                        tabBarInactiveTintColor: '#666666',
          tabBarIcon: ({ color }) => <UiIconSymbol size={28} name="wallet.pass.fill" color={color} />,
        }}
      />

    </Tabs>
  )
}
