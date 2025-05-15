// // app/video-showcase.tsx
// import React from 'react';
// import {Dimensions, ScrollView, StyleSheet, Text} from 'react-native';
// import {ResizeMode, Video as VideoAV} from 'expo-av';
//
// const videoUri  = 'https://firebasestorage.googleapis.com/v0/b/recap-d22e0.firebasestorage.app/o/postVideos%2FdcDZ5AhWH6DdxNP9eJed.mov?alt=media&token=80c5c014-e57c-41ce-a9c3-391a7a810f72'; // or use a URL if needed
//
// const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
//
// const Page = () => {
//     return (
//         <ScrollView contentContainerStyle={styles.container}>
//             <Text style={styles.heading}>Full Screen</Text>
//             <VideoAV
//                 source={{ uri: videoUri }}
//                 style={styles.fullscreen}
//                 // useNativeControls
//                 resizeMode={ResizeMode.COVER}
//                 // isLooping
//             />
//
//             <Text style={styles.heading}>Full Width, 70% Height</Text>
//             <VideoAV
//                 source={{ uri: videoUri }}
//                 style={styles.medium}
//                 // useNativeControls
//                 resizeMode={ResizeMode.COVER}
//                 // isLooping
//             />
//
//             <Text style={styles.heading}>33% Width, 20% Height</Text>
//             <VideoAV
//                 source={{ uri: videoUri }}
//                 style={styles.small}
//                 // useNativeControls
//                 resizeMode={ResizeMode.COVER}
//                 // isLooping
//             />
//         </ScrollView>
//     );
// }
//
// const styles = StyleSheet.create({
//     container: {
//         alignItems: 'center',
//         paddingVertical: 20,
//         backgroundColor: '#000',
//     },
//     heading: {
//         color: '#fff',
//         fontSize: 18,
//         marginTop: 20,
//         marginBottom: 10,
//     },
//     fullscreen: {
//         width: screenWidth,
//         height: screenHeight,
//     },
//     medium: {
//         width: screenWidth,
//         height: screenHeight * 0.7,
//     },
//     small: {
//         width: screenWidth * 0.33,
//         height: screenHeight * 0.2,
//     },
// });
//
// export default Page;
