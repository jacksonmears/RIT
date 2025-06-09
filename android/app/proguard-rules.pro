# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# react-native-vision-camera
-keep class com.mrousavy.camera.** { *; }
-keep class org.webrtc.** { *; }

# CameraX support (used internally by vision-camera)
-keep class androidx.camera.core.** { *; }
-keep class androidx.camera.lifecycle.** { *; }
-keep class androidx.camera.video.** { *; }
-keep class androidx.camera.view.** { *; }
-keep class androidx.camera.camera2.** { *; }

# Required for permission checks
-keep class androidx.core.app.ActivityCompat { *; }
-keep class androidx.core.content.ContextCompat { *; }

# JNI & reflection support
-keepclasseswithmembernames class * {
    native <methods>;
}
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes *Annotation*, Signature, InnerClasses

# General React Native
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.modules.** { *; }
-keep class com.facebook.react.** { *; }

# Prevent obfuscation of expo packages (if using Expo bare workflow)
-keep class expo.modules.** { *; }

# Optional: MLKit (if using barcode or face detection plugins with vision-camera)
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**

# Optional: TensorFlow Lite (if used)
-keep class org.tensorflow.lite.** { *; }
-dontwarn org.tensorflow.lite.**

