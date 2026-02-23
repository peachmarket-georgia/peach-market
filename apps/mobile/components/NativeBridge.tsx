import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import { Alert } from 'react-native'

/**
 * 네이티브 브릿지 - 웹과 네이티브 기능 연결
 *
 * 지원 기능:
 * - OPEN_CAMERA: 카메라로 사진 촬영 또는 갤러리에서 선택
 * - REQUEST_LOCATION: 현재 위치 조회
 * - REQUEST_NOTIFICATION_PERMISSION: 푸시 알림 권한 요청
 */

export interface NativeBridgeMessage {
  type: string
  data?: any
}

export interface NativeBridgeResult {
  type: string
  data?: any
  error?: string
}

/**
 * WebView에서 받은 메시지 처리
 */
export async function handleNativeRequest(message: NativeBridgeMessage): Promise<NativeBridgeResult> {
  try {
    switch (message.type) {
      case 'OPEN_CAMERA':
        return await handleCameraRequest()

      case 'REQUEST_LOCATION':
        return await handleLocationRequest()

      case 'REQUEST_NOTIFICATION_PERMISSION':
        return await handleNotificationPermission()

      default:
        return {
          type: 'ERROR',
          error: `Unknown message type: ${message.type}`,
        }
    }
  } catch (error) {
    console.error('❌ [Native Bridge] Error:', error)
    return {
      type: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * 카메라 / 이미지 선택 처리
 */
async function handleCameraRequest(): Promise<NativeBridgeResult> {
  // 권한 요청
  const cameraPermission = await ImagePicker.requestCameraPermissionsAsync()
  const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync()

  if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
    Alert.alert('권한 필요', '카메라 및 사진 라이브러리 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.', [
      { text: '확인' },
    ])
    return {
      type: 'CAMERA_RESULT',
      error: 'Permission denied',
    }
  }

  // 사용자에게 선택 옵션 제공
  return new Promise((resolve) => {
    Alert.alert('사진 선택', '사진을 어떻게 추가하시겠습니까?', [
      {
        text: '카메라로 촬영',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: 'images' as any,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })

          if (!result.canceled && result.assets[0]) {
            resolve({
              type: 'CAMERA_RESULT',
              data: {
                uri: result.assets[0].uri,
                width: result.assets[0].width,
                height: result.assets[0].height,
              },
            })
          } else {
            resolve({
              type: 'CAMERA_RESULT',
              error: 'Cancelled',
            })
          }
        },
      },
      {
        text: '갤러리에서 선택',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images' as any,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })

          if (!result.canceled && result.assets[0]) {
            resolve({
              type: 'CAMERA_RESULT',
              data: {
                uri: result.assets[0].uri,
                width: result.assets[0].width,
                height: result.assets[0].height,
              },
            })
          } else {
            resolve({
              type: 'CAMERA_RESULT',
              error: 'Cancelled',
            })
          }
        },
      },
      {
        text: '취소',
        style: 'cancel',
        onPress: () => {
          resolve({
            type: 'CAMERA_RESULT',
            error: 'Cancelled',
          })
        },
      },
    ])
  })
}

/**
 * 위치 정보 조회
 */
async function handleLocationRequest(): Promise<NativeBridgeResult> {
  // 권한 요청
  const { status } = await Location.requestForegroundPermissionsAsync()

  if (status !== 'granted') {
    Alert.alert('권한 필요', '위치 정보 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.', [{ text: '확인' }])
    return {
      type: 'LOCATION_RESULT',
      error: 'Permission denied',
    }
  }

  // 현재 위치 조회
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  })

  return {
    type: 'LOCATION_RESULT',
    data: {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    },
  }
}

/**
 * 푸시 알림 권한 요청
 */
async function handleNotificationPermission(): Promise<NativeBridgeResult> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return {
      type: 'NOTIFICATION_PERMISSION',
      data: {
        granted: false,
      },
    }
  }

  // Expo Push Token 발급
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: '25ff0aff-c0a8-49e4-bedb-8db4c14f3901',
  })

  return {
    type: 'NOTIFICATION_PERMISSION',
    data: {
      granted: true,
      token: token.data,
    },
  }
}
