import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import React, {useEffect, useState} from "react";
import {doc, getDoc, deleteDoc, collection, getDocs, addDoc, setDoc, serverTimestamp} from "firebase/firestore";
import {auth,db} from "@/firebase";

interface User {
    id: string;
    username: string,
    photoURL: string,
}

interface UserCompProps {
    info: User;
}



const SearchCard: React.FC<UserCompProps> = ({ info }) => {
    const router = useRouter();
    const user = auth.currentUser;



    return (

        <View style={styles.resultItem}>

            <TouchableOpacity style={styles.friendReqButton} onPress={() =>  router.push({ pathname: "/search/accountPage", params: { friendID: info.id }})}>
                <View style={styles.avatarView}>
                    <Image source={{ uri: info.photoURL }} style={styles.avatar} />
                    <Text style={styles.resultText}>{info.username}</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    resultItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#D3D3FF',
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 25,
        height: 25,
        borderRadius: 20,
        marginRight: 10,
        // backgroundColor: '#ccc',
    },
    friendReqButton: {
        borderRadius: 4,
        padding: 1,
    },
    resultText: {
        fontSize: 16,
        color: 'white',
    },
    avatarView: {
        flexDirection: 'row',
    }
});

export default SearchCard;
