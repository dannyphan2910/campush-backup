import React from 'react'
import { AntDesign } from '@expo/vector-icons';
import { Button } from '@ui-kitten/components';
import { Dimensions, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/core';

const windowWidth = Dimensions.get('window').width;

export default function HeaderSell() {
    const navigation = useNavigation()
    const handleButton = () => navigation.navigate('SellProduct')

    return (
        <TouchableOpacity onPress={handleButton} style={styles.button}>
            <AntDesign name="pluscircleo" size={20} color="black" />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
    },
});