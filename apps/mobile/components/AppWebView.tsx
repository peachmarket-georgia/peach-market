import React, { useRef, useState, useEffect } from 'react'
import { View, ActivityIndicator, Platform, BackHandler } from 'react-native'
import { WebView, WebViewNavigation } from 'react-native-webview'
import { StatusBar } from 'expo-status-bar'
import { WEB_URL } from '../constants/config'
import { handleNativeRequest } from './NativeBridge'

interface AppWebViewProps {
  initialUrl?: string
  onNavigationStateChange?: (navState: WebViewNavigation) => void
}

export default function AppWebView({ initialUrl = `${WEB_URL}/login`, onNavigationStateChange }: AppWebViewProps) {
  const webViewRef = useRef<WebView>(null)
  const [loading, setLoading] = useState(true)
  const [canGoBack, setCanGoBack] = useState(false)

  // JavaScript code to inject into WebView
  const injectedJavaScript = `
    (function() {
      // Detect WebView environment
      window.isReactNativeWebView = true;

      // Override console for debugging
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;

      console.log = function(...args) {
        originalConsoleLog.apply(console, args);
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'CONSOLE_LOG',
          level: 'log',
          data: args.map(arg => String(arg))
        }));
      };

      console.error = function(...args) {
        originalConsoleError.apply(console, args);
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'CONSOLE_LOG',
          level: 'error',
          data: args.map(arg => String(arg))
        }));
      };

      console.warn = function(...args) {
        originalConsoleWarn.apply(console, args);
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'CONSOLE_LOG',
          level: 'warn',
          data: args.map(arg => String(arg))
        }));
      };

      // Send ready signal
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'WEBVIEW_READY'
      }));
    })();
    true;
  `

  // Handle messages from WebView
  const handleMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data)

      switch (message.type) {
        case 'CONSOLE_LOG':
          const emoji = message.level === 'error' ? '❌' : message.level === 'warn' ? '⚠️' : '📱'
          console.log(`${emoji} [WebView ${message.level}]`, ...message.data)
          break
        case 'WEBVIEW_READY':
          console.log('✅ [WebView] Ready')
          break
        // 네이티브 기능 요청 (카메라, 위치, 알림 등)
        case 'OPEN_CAMERA':
        case 'REQUEST_LOCATION':
        case 'REQUEST_NOTIFICATION_PERMISSION':
          const result = await handleNativeRequest(message)
          webViewRef.current?.postMessage(JSON.stringify(result))
          break
        default:
          console.log('📨 [WebView] Message:', message)
      }
    } catch (error) {
      console.error('❌ [WebView] Message parse error:', error)
    }
  }

  // Handle navigation state changes
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack)
    onNavigationStateChange?.(navState)
  }

  // Android back button handler
  useEffect(() => {
    if (Platform.OS !== 'android') return

    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack()
        return true // Prevent default behavior
      }
      return false // Allow default behavior (exit app)
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)

    return () => backHandler.remove()
  }, [canGoBack])

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />

      {loading && (
        <View
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'white',
            zIndex: 10,
          }}
        >
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: initialUrl }}
        style={{ flex: 1 }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        // Authentication & Cookies
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        // Security & Features
        allowsBackForwardNavigationGestures={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Performance
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        // iOS specific
        allowsLinkPreview={false}
        // Android specific
        domStorageEnabled={true}
        javaScriptEnabled={true}
        mixedContentMode="compatibility"
        // Debugging
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent
          console.error('❌ [WebView] Error:', nativeEvent)
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent
          console.error('❌ [WebView] HTTP Error:', nativeEvent.statusCode, nativeEvent.url)
        }}
      />
    </View>
  )
}
