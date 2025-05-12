import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import React, {useEffect, useState} from "react";
import {doc, getDoc, deleteDoc, collection, getDocs, addDoc, setDoc, serverTimestamp} from "firebase/firestore";
import {auth,db} from "@/firebase";

interface User {
    id: string;
    username: string,
    photoURL: string,
    firstName: string,
    lastName: string,
}

interface UserCompProps {
    info: User;
}



const SearchCard: React.FC<UserCompProps> = ({ info }) => {
    const router = useRouter();
    const user = auth.currentUser;



    return (

        <TouchableOpacity style={styles.resultItem} onPress={() =>  router.push({ pathname: "/search/accountPage", params: { friendID: info.id }})}>
            <View style={styles.avatarView}>
                <Image source={{ uri: info.photoURL }} style={styles.avatar} />
                <View style={styles.namesView}>
                    <Text style={styles.userNameText}>{info.username}</Text>
                    <Text style={styles.nameText}>{info.firstName} {info.lastName}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    resultItem: {
        padding: 15,
        // borderWidth: 1,
        // borderColor: '#D3D3FF',
        flexDirection: 'row',
        marginBottom: 2,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        // backgroundColor: '#ccc',
    },
    friendReqButton: {
        borderRadius: 4,
        padding: 1,
    },
    userNameText: {
        fontSize: 16,
        color: 'white',
    },
    nameText: {
      color: 'grey',
      fontSize: 12
    },
    avatarView: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    namesView: {

    }
});

export default SearchCard;
