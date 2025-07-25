import { StyleSheet, Text, type TextProps } from 'react-native'
import { useThemeColor } from '@/hooks/use-theme-color'

export type AppTextProps = TextProps & {
  lightColor?: string
  darkColor?: string
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link'
}

export function AppText({ style, lightColor, darkColor, type = 'default', ...rest }: AppTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text')

  return (
    <Text
      style={[
        { color },

        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  default: {
    fontSize: 14,
     fontFamily: 'MinecraftStandard',
          color:"#01df1e"
  },
  defaultSemiBold: {
    fontSize: 12,
     fontFamily: 'MinecraftStandard',
     color:"#01df1e"
  },

  title: {
    fontSize: 24,
    fontFamily: 'MinecraftStandardBold',
     color:"#01df1e"
  },
  subtitle: {
    fontSize: 14,
     fontFamily: 'MinecraftStandard',
   color:"#01df1e"
  },
  link: {
    fontSize: 16,
     fontFamily: 'MinecraftStandard',
     color:"#01df1e"
  },

})
