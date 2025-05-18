// import React, {useState, useEffect, useCallback} from 'react';
// import {
//     View,
//     Text,
//     StyleSheet,
//     Image,
//     Dimensions,
//     FlatList,
//     TouchableOpacity,
//     Animated
// } from 'react-native';
// import { auth, db } from '@/firebase';
// import { useFocusEffect} from '@react-navigation/native';
// import { useRouter } from 'expo-router'
// import {serverTimestamp} from "firebase/firestore";
// import AccountPost from "../../../components/AccountPost";
// import Ionicons from '@expo/vector-icons/Ionicons';
// import { getSavedUser, clearUser } from '@/authStorage';
//
//
// const { width, height } = Dimensions.get('window');
//
// type PostType = {
//     id: string;
//     content: string;
//     caption: string;
//     mode: string;
//     userID: string;
// }
//
// export default function Page(){
//     const user = auth().currentUser;
//     const router = useRouter();
//     const [numPosts, setNumPosts] = useState(0);
//     const [numFriends, setNumFriends] = useState(0);
//     const [pfp, setPfp] = useState<string>('');
//     const [firstName, setFirstName] = useState<string>("");
//     const [lastName, setLastName] = useState<string>('');
//     const [bio, setBio] = useState('');
//     const [postContents, setPostContents] = useState<PostType[] | []>([]);
//     const [posts, setPosts] = useState<{ id: string }[] | null>(null);
//     const [refreshing, setRefreshing] = useState(false);
//     const [animatedValues, setAnimatedValues] = useState<Animated.Value[]>([]);
//     const [totalCharacters, setTotalCharacters] = useState<string>("");
//
//
//     useEffect(() => {
//         const loadUid = async () => {
//             const storedUid = await getSavedUser();
//             if (storedUid) {
//                 await getBioInfo();
//                 await fetchUserPosts();
//             } else {
//                 handleLogout().catch((err) => {
//                     console.error(err);
//                 });
//             }
//         };
//         loadUid().catch((err) => {
//             console.error(err);
//         });
//     }, []);
//
//
//     // useEffect(() => {
//     //     const getInfo = async () => {
//     //         await getBioInfo()
//     //         await fetchUserPosts();
//     //     }
//     //     getInfo().catch((err) => {
//     //         console.error(err);
//     //     });
//     // }, []);
//
//     useEffect(() => {
//         getPostContent().catch((err) => {
//             console.error(err);
//         })
//     }, [posts]);
//
//
//     useEffect(() => {
//         const values = Array.from({ length: totalCharacters.length}, () => new Animated.Value(0));
//         setAnimatedValues(values);
//     }, [totalCharacters]);
//
//     useEffect(() => {
//         setTotalCharacters(firstName+' '+lastName);
//     }, [firstName, lastName]);
//
//     const runAnimation = useCallback(() => {
//         if (animatedValues.length === 0) return;
//
//         const animations = animatedValues.map((val) =>
//             Animated.sequence([
//                 Animated.timing(val, {
//                     toValue: 1,
//                     duration: 300,
//                     useNativeDriver: true,
//                 }),
//                 Animated.timing(val, {
//                     toValue: 0,
//                     duration: 300,
//                     useNativeDriver: true,
//                 }),
//             ])
//         );
//
//         Animated.stagger(100, animations).start();
//     }, [animatedValues]);
//
//     useFocusEffect(
//         useCallback(() => {
//             runAnimation();
//         }, [runAnimation])
//     );
//
//     useEffect(() => {
//         if (!refreshing) {
//             runAnimation();
//         }
//     }, [refreshing, runAnimation]);
//
//
//
//     const fetchUserPosts = async () => {
//         if (!user) return;
//
//         try {
//             const postsRef = db().collection("users").doc(user.uid).collection("posts")
//             const orderedQuery = postsRef.orderBy("timestamp", "asc");
//             const usersDocs = await orderedQuery.get();
//
//             try {
//                 const userPfpRef = await db().collection("users").doc(user.uid).get();
//
//                 const data = userPfpRef.data();
//                 if (userPfpRef.exists() && data) setPfp(data.photoURL)
//
//
//                 const postList = usersDocs.docs.map((doc) => ({
//                     id: doc.id,
//                     timestamp: serverTimestamp(),
//                 }));
//
//                 setPosts(postList);
//             } catch (error) {
//                 console.error(error);
//             }
//         } catch (error) {
//             console.error("Error fetching data:", error);
//         }
//     };
//
//
//     const getBioInfo = async () => {
//         if (!user) return;
//
//         const getInfo = await db().collection("users").doc(user.uid).get();
//         const data = getInfo.data();
//         if (! getInfo.exists() || !data) return;
//
//         try {
//             setBio(data.bio);
//             setFirstName(data.firstName);
//             setLastName(data.lastName);
//
//             const fetchFriendCount = await db().collection("users").doc(user.uid).collection("friends").get();
//             const fetchPostCount = await db().collection("users").doc(user.uid).collection("posts").get();
//
//             setNumFriends(fetchFriendCount.size);
//             setNumPosts(fetchPostCount.size);
//         } catch (error) {
//             console.error(error);
//         }
//     }
//
//
//     const getPostContent = async () => {
//         if (!posts || !user) return;
//
//         try {
//             const raw = await Promise.all(posts.map(async (post) => {
//                 const postSnap = await db().collection("users").doc(post.id).get();
//
//                 const data = postSnap.data();
//                 if (!postSnap.exists() || !data) return;
//
//                 return { id: post.id, content: data.content, caption: data.caption, mode: data.mode, userID: user.uid };
//             }));
//             const validPosts = raw.filter((p): p is PostType => p !== null)
//             setPostContents(validPosts.reverse());
//
//         } catch (error) {
//             console.error("Error fetching post content:", error);
//         }
//     };
//
//     const onRefresh = async () => {
//         setRefreshing(true);
//         await fetchUserPosts();
//         await getBioInfo()
//         setRefreshing(false);
//     }
//
//
//     const handleLogout = async () => {
//         try {
//             await auth().signOut();
//             await clearUser();
//             router.push('/');
//         } catch (error) {
//             console.error('Logout failed:', error);
//         }
//     };
//
//     const renderTopBar = () => (
//         <View style={styles.topBar}>
//             <View style={styles.backArrowName}>
//                 {user && <Text style={styles.topBarText}>{user.displayName}</Text>}
//             </View>
//             <View>
//                 <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
//                     <Text>Logout</Text>
//                 </TouchableOpacity>
//             </View>
//         </View>
//     )
//
//     const renderAnimatedName = () => (
//         <View style={styles.containerName}>
//             {totalCharacters.split('').map((char, index) => {
//                 const val = animatedValues[index];
//                 if (!val) return null;
//
//                 const scale = val.interpolate({
//                     inputRange: [0, 1],
//                     outputRange: [1, 1.4],
//                 });
//
//                 const colorScale = val.interpolate({
//                     inputRange: [0, 0.5],
//                     outputRange: ["#D3D3FF", "white"],
//                 });
//
//                 return (
//                     <Animated.Text
//                         key={index}
//                         style={[styles.char, { transform: [{ scale }], color: colorScale}]}
//                     >
//                         {char}
//                     </Animated.Text>
//                 );
//             })}
//         </View>
//     )
//
//     const renderPfp = () => (
//         <View style={styles.pfpAndInfo}>
//             <TouchableOpacity style={styles.pfpBox} onPress={() => router.push("/account/editPfp")}>
//                 <View>
//                     {pfp ? (
//                         <Image source={{ uri: pfp }} style={styles.avatar} />
//                     ) : (
//                         <View style={[styles.avatar, styles.placeholder]}>
//                             <Text style={styles.placeholderText}>No Photo</Text>
//                         </View>
//                     )}
//                     <View style={styles.changePfp}>
//                         <Ionicons name="add-circle" size={height/33} color="white" />
//                     </View>
//                 </View>
//             </TouchableOpacity>
//             <View style={{alignItems: "center"}}>
//                 <View style={styles.flexDirectionRow}>
//                     <View style={styles.flexDirectionRow}>
//                         <Text style={styles.infoText}>{numPosts}</Text>
//                         <Text style={styles.numberText}> posts</Text>
//                     </View>
//                     <View style={styles.flexDirectionRow}>
//                         <Text style={styles.infoText}>{numFriends}</Text>
//                         <Text style={styles.numberText}> friends</Text>
//                     </View>
//                 </View>
//
//             </View>
//         </View>
//     )
//
//     const renderBio = () => (
//         <View style={styles.bioAndButtonBox}>
//             <View style={styles.bioBox}>
//                 <Text style={styles.bioText}>{bio}</Text>
//             </View>
//             <TouchableOpacity style={styles.editContainer} onPress={() => router.push("/account/editProfile")}>
//                 <Text style={styles.nameText}>Edit profile</Text>
//             </TouchableOpacity>
//
//         </View>
//
//     )
//
//     const renderFlatList = () => (
//         <View style={styles.postContainer}>
//             {user && <FlatList
//                 style={styles.groups}
//                 data={postContents}
//                 keyExtractor={(item) => item.id}
//                 renderItem={({ item, index }) => (
//                     <TouchableOpacity onPress={() => router.push({pathname: '/account/post', params: {rawID: user.uid, rawContent: item.content, rawCaption: item.caption, rawUsername: user.displayName, rawMode: item.mode, rawPhotoURL: encodeURIComponent(pfp)}})}>
//                         <AccountPost post={item} index={index} />
//                     </TouchableOpacity>
//
//                 )}
//                 refreshing={refreshing}
//                 onRefresh={onRefresh}
//                 numColumns={3}
//             />}
//         </View>
//     )
//
//     return (
//
//
//         <View style={styles.container}>
//             {renderTopBar()}
//             {renderAnimatedName()}
//             {renderPfp()}
//             {renderBio()}
//             {renderFlatList()}
//         </View>
//     );
// };
//
// const styles = StyleSheet.create({
//     container: {
//         backgroundColor: 'black',
//         flex: 1,
//     },
//     topBar: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         paddingHorizontal: width/20,
//         paddingVertical: height/90,
//         borderBottomWidth: height/1000,
//         borderBottomColor: "grey",
//     },
//     logoutButton: {
//         backgroundColor: "#D3D3FF",
//         borderRadius: width/100,
//         padding: width/100
//     },
//     backArrowName: {
//         flexDirection: 'row',
//         alignItems: "center",
//     },
//     topBarText: {
//         color: "#D3D3FF",
//     },
//     containerName: {
//         flexDirection: 'row',
//         justifyContent: 'center',
//         marginTop: height/50,
//     },
//     char: {
//         fontSize: height/33,
//         color: "#D3D3FF",
//     },
//     pfpAndInfo: {
//         alignItems: 'center',
//         marginBottom: height/50,
//     },
//     pfpBox: {
//         marginTop: height/50,
//         marginBottom: height/70
//     },
//     avatar: {
//         width: width/2.8,
//         height: width/2.8,
//         borderRadius: 999,
//     },
//     placeholder: {
//         backgroundColor: '#444',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     placeholderText: {
//         color: 'white',
//     },
//     changePfp: {
//         backgroundColor: "black",
//         borderRadius: 999,
//         padding: width/200,
//         position: 'absolute',
//         top: height/8.6,
//         left: width/3.8
//     },
//     flexDirectionRow: {
//         flexDirection: 'row',
//     },
//     infoText: {
//         color: "#D3D3FF",
//         marginLeft: width/50,
//     },
//     numberText: {
//         color: "white",
//     },
//     bioAndButtonBox: {
//         marginHorizontal: width/10,
//     },
//     bioBox: {
//         marginTop: width/100
//     },
//     bioText: {
//         color: 'white',
//     },
//     editContainer: {
//         marginVertical: height/50,
//         alignItems: "center",
//         justifyContent: "center",
//         borderRadius: width/75,
//         borderWidth: height/1000,
//         borderColor: "#D3D3FF",
//     },
//     nameText: {
//         color: "#D3D3FF",
//         fontWeight: 'bold',
//     },
//     postContainer: {
//         flex: 1,
//         marginHorizontal: width/200,
//         marginTop: height/100
//     },
//     groups: {
//         flex: 1,
//     },
// });



import React, {useState, useEffect, useCallback} from 'react';
import {
    View,
    Text,
    Button,
    StyleSheet,
    Image,
    Dimensions,
    FlatList,
    TouchableOpacity,
    Animated
} from 'react-native';
import { auth, db } from '@/firebase';
import { useFocusEffect} from '@react-navigation/native';
import { useRouter } from 'expo-router'
import {serverTimestamp} from "firebase/firestore";
import AccountPost from "../../../components/AccountPost";
import Ionicons from '@expo/vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

type PostType = {
    id: string;
    content: string;
    caption: string;
    mode: string;
    userID: string;
}


const Page = () => {
    const user = auth().currentUser;
    const [numPosts, setNumPosts] = useState(0);
    const [numFriends, setNumFriends] = useState(0);
    const [pfp, setPfp] = useState<string>('');
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>('');
    const [bio, setBio] = useState('');
    const [postContents, setPostContents] = useState<PostType[] | []>([]);
    const [posts, setPosts] = useState<{ id: string }[] | null>(null);
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [animatedValues, setAnimatedValues] = useState<Animated.Value[]>([]);
    const [totalCharacters, setTotalCharacters] = useState<string>("");


    useEffect(() => {
        const getInfo = async () => {
            await getBioInfo()
            await fetchUserPosts();
        }
        getInfo().catch((err) => {
            console.error(err);
        });
    }, []);

    useEffect(() => {
        getPostContent().catch((err) => {
            console.error(err);
        })
    }, [posts]);


    useEffect(() => {
        const values = Array.from({ length: totalCharacters.length}, () => new Animated.Value(0));
        setAnimatedValues(values);
    }, [totalCharacters]);

    useEffect(() => {
        setTotalCharacters(firstName+' '+lastName);
    }, [firstName, lastName]);

    const runAnimation = useCallback(() => {
        if (animatedValues.length === 0) return;

        const animations = animatedValues.map((val) =>
            Animated.sequence([
                Animated.timing(val, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(val, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ])
        );

        Animated.stagger(100, animations).start();
    }, [animatedValues]);

    useFocusEffect(
        useCallback(() => {
            runAnimation();
        }, [runAnimation])
    );

    useEffect(() => {
        if (!refreshing) {
            runAnimation();
        }
    }, [refreshing, runAnimation]);



    const fetchUserPosts = async () => {
        if (!user) return;
        try {
            const postsRef = db().collection("users").doc(user.uid).collection("posts")
            const orderedQuery = postsRef.orderBy("timestamp", "asc")
            const usersDocs = await orderedQuery.get();

            const userPfpRef = await db().collection("users").doc(user.uid).get()
            const data = userPfpRef.data()
            if (!userPfpRef.exists() || !data) return;
            setPfp(data.photoURL)

            const postList = usersDocs.docs.map((doc) => ({
                id: doc.id,
                timestamp: serverTimestamp(),
            }));

            setPosts(postList);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };


    const getBioInfo = async () => {
        if (!user) return;
        const getInfo = await db().collection("users").doc(user.uid).get()
        const data = getInfo.data()
        if (!getInfo.exists() || !data) return;

        setBio(data.bio);
        setFirstName(data.firstName);
        setLastName(data.lastName);

        const fetchFriendCount = await db().collection("users").doc(user.uid).collection("friends").get();
        const fetchPostCount = await db().collection("users").doc(user.uid).collection("posts").get();

        setNumFriends(fetchFriendCount.size);
        setNumPosts(fetchPostCount.size);

    }


    const getPostContent = async () => {
        if (!posts || !user) return;
        try {
            const postContents = await Promise.all(posts.map(async (post) => {
                const postRef = db().collection("posts").doc(post.id)
                const postSnap = await postRef.get();
                const data = postSnap.data()

                if (!postSnap.exists() || !data) return;

                return { id: post.id, content: data.content, caption: data.caption, mode: data.mode, userID: user.uid };

            }));
            const validPosts = postContents.filter((p):p is PostType => p !== null)

            setPostContents(validPosts.reverse());
        } catch (error) {
            console.error("Error fetching post content:", error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUserPosts();
        await getBioInfo()
        setRefreshing(false);
    }




    const handleLogout = async () => {
        await auth().signOut();
    }

    const renderTopBar = () => (
        <View style={styles.topBar}>
            <View style={styles.backArrowName}>
                <Text style={styles.topBarText}>{user?.displayName}</Text>
            </View>
            <View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text>LOGOUT</Text>
                </TouchableOpacity>
            </View>
        </View>
    )

    const renderAnimatedName = () => (
        <View style={styles.containerName}>
            {totalCharacters.split('').map((char, index) => {
                const val = animatedValues[index];
                if (!val) return null;

                const scale = val.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.4],
                });

                const colorScale = val.interpolate({
                    inputRange: [0, 0.5],
                    outputRange: ["#D3D3FF", "white"],
                });

                return (
                    <Animated.Text
                        key={index}
                        style={[styles.char, { transform: [{ scale }], color: colorScale}]}
                    >
                        {char}
                    </Animated.Text>
                );
            })}
        </View>
    )

    const renderPfp = () => (
        <View style={styles.pfpAndInfo}>
            <TouchableOpacity style={styles.pfpBox} onPress={() => router.push({pathname: "/account/editPfp", params: {rawName: totalCharacters, rawPhotoURL: encodeURIComponent(pfp)}})}>
                <View>
                    {pfp ? (
                        <Image source={{ uri: pfp }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.placeholder]}>
                            <Text style={styles.placeholderText}>No Photo</Text>
                        </View>
                    )}
                    <View style={styles.changePfp}>
                        <Ionicons name="add-circle" size={24} color="white" />
                    </View>
                </View>
            </TouchableOpacity>
            <View style={styles.pfpSeparator}></View>
            <View style={styles.infoBox}>
                <View style={styles.info}>
                    <View style={styles.postsInfo}>
                        <Text style={styles.infoText}>{numPosts}</Text>
                        <Text style={styles.genericText}> posts</Text>
                    </View>
                    <View style={styles.pfpSeparator}></View>
                    <View style={styles.friendInfo}>
                        <Text style={styles.infoText}>{numFriends}</Text>
                        <Text style={styles.genericText}> friends</Text>
                    </View>
                </View>

            </View>
        </View>
    )

    const renderBio = () => (
        <View style={styles.bioAndButtonBox}>
            <View style={styles.bioBox}>
                <Text style={styles.genericText}>{bio}</Text>
            </View>
            <TouchableOpacity style={styles.editContainer} onPress={() => router.push("/account/editProfile")}>
                <Text style={styles.nameText}>Edit profile</Text>
            </TouchableOpacity>

        </View>

    )

    const renderFlatList = () => (
        <View style={styles.postContainer}>
            <FlatList
                style={[styles.groups, {marginTop: height*0.02, marginBottom: height*0.07}]}
                data={postContents}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <TouchableOpacity onPress={() => router.push({pathname: '/account/post', params: {rawID: user?.uid, rawContent: item.content, rawCaption: item.caption, rawUsername: user?.displayName, rawMode: item.mode, rawPhotoURL: encodeURIComponent(pfp)}})}>
                        <View style={styles.itemContainer}>
                            <AccountPost post={item} index={index}/>
                        </View>
                    </TouchableOpacity>

                )}

                refreshing={refreshing}              // 👈 NEW
                onRefresh={onRefresh}                // 👈 NEW
                numColumns={3}
            />
        </View>
    )

    return (


        <View style={styles.container}>
            {renderTopBar()}
            {renderAnimatedName()}
            {renderPfp()}
            {renderBio()}
            {renderFlatList()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'black',
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: width/20,
        borderBottomWidth: height/1000,
        borderBottomColor: "grey",
        alignItems: 'center',
        height: height/20
    },
    logoutButton: {
        backgroundColor: "red",
        alignItems: "center",
        justifyContent: "center",
        padding: width/100
    },
    pfpBox: {
        marginTop: 30,
        marginBottom: 15
    },
    infoBar: {
        marginTop: 30,
        marginHorizontal: 40,

        alignItems: "center",
    },
    pfpAndInfo: {
        alignItems: 'center',
        marginBottom: 30,
    },
    pfpSeparator: {
        width: 50
    },
    infoBox: {
        alignItems: 'center',
    },
    nameText: {
        color: "#D3D3FF",
        fontWeight: 'bold',
    },
    info: {
        flexDirection: 'row',
    },
    postsInfo: {
        flexDirection: 'row',
    },
    friendInfo: {
        flexDirection: 'row',
    },
    bioBox: {
        marginTop: 10
    },
    genericText: {
        color: 'white',
    },
    groups: {
        flex: 1,
    },
    itemContainer: {
        flex: 1 / 3,
        // paddingVertical: 0.5,
        // paddingHorizontal: 0.5,
    },
    postContainer: {
        flex: 1,
    },
    avatar: {
        width: 150,
        height: 150,
        borderRadius: 999,
    },
    placeholder: {
        backgroundColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: 'white',
    },

    topBarText: {
        color: "#D3D3FF",
    },
    backArrowName: {
        flexDirection: 'row',
        alignItems: "center",
    },
    changePfp: {
        backgroundColor: "black",
        borderRadius: 999,
        padding: 3,
        position: 'absolute',
        top: 110,
        left: 110

    },
    editContainer: {
        marginVertical: 20,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#D3D3FF",
    },
    containerName: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
    },
    char: {
        fontSize: 20,
        color: "#D3D3FF",
    },
    bioAndButtonBox: {
        marginHorizontal: 50,
    },
    infoText: {
        color: "#D3D3FF",
    }

});

export default Page;
