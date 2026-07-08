import React, { useState } from 'react'
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  PinchGestureHandler,
  PanGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import { X } from 'lucide-react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface ImageZoomProps {
  imageUrl: string
  visible: boolean
  onClose: () => void
}

export function ImageZoom({ imageUrl, visible, onClose }: ImageZoomProps) {
  const scale = useSharedValue(1)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const savedScale = useSharedValue(1)
  const savedTranslateX = useSharedValue(0)
  const savedTranslateY = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  const handlePinch = (event: any) => {
    const newScale = savedScale.value * event.scale
    scale.value = Math.max(1, Math.min(newScale, 5))
  }

  const handlePinchEnd = () => {
    savedScale.value = scale.value
    if (scale.value <= 1) {
      scale.value = withTiming(1, { duration: 200 })
      translateX.value = withTiming(0, { duration: 200 })
      translateY.value = withTiming(0, { duration: 200 })
      savedTranslateX.value = 0
      savedTranslateY.value = 0
    }
  }

  const handlePan = (event: any) => {
    if (scale.value > 1) {
      translateX.value = savedTranslateX.value + event.translationX
      translateY.value = savedTranslateY.value + event.translationY
    }
  }

  const handlePanEnd = () => {
    savedTranslateX.value = translateX.value
    savedTranslateY.value = translateY.value
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        <View style={styles.backdrop}>
          <PanGestureHandler onGestureEvent={handlePan} onEnded={handlePanEnd}>
            <Animated.View style={styles.animatedContainer}>
              <PinchGestureHandler onGestureEvent={handlePinch} onEnded={handlePinchEnd}>
                <Animated.View style={[styles.imageContainer, animatedStyle]}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          accessibilityLabel="Close image viewer"
          accessibilityHint="Double tap to close"
        >
          <X size={28} color="white" />
        </TouchableOpacity>
      </GestureHandlerRootView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
})
