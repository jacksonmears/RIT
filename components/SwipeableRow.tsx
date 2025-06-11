// components/SwipeableRow.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import AntDesign from '@expo/vector-icons/AntDesign';

const { width } = Dimensions.get('window');

type GroupType = {
    id: string;
    name: string;
    favorite: boolean;
};

type Props = {
    item: GroupType;
    children: React.ReactNode;
    onFavorite: (item: GroupType) => void;
    onDelete: (item: GroupType) => void;
};

const SwipeableRow = ({ item, children, onFavorite, onDelete }: Props) => {
    const renderRightActions = () => (
        <View style={styles.rowBack}>
            <TouchableOpacity style={styles.backRightBtn} onPress={() => onFavorite(item)}>
                <AntDesign
                    name={item.favorite ? 'star' : 'staro'}
                    size={24}
                    color={item.favorite ? 'yellow' : 'white'}
                />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]} onPress={() => onDelete(item)}>
                <Text style={styles.backTextWhite}>🗑️</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Swipeable renderRightActions={renderRightActions}>
            {children}
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    rowBack: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingRight: 10,
    },
    backRightBtn: {
        width: width * 0.12,
        alignItems: 'center',
        justifyContent: 'center',
        height: '60%'
    },
    backRightBtnRight: {
        backgroundColor: 'red',
        marginLeft: 5,
        borderRadius: 8,
    },
    backTextWhite: {
        fontWeight: 'bold',
        fontSize: 18,
        color: 'white',
    },
});

export default SwipeableRow;
