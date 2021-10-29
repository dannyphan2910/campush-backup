import React from 'react'
import { AntDesign } from '@expo/vector-icons';
import { Button } from '@ui-kitten/components';
import { Dimensions, StatusBar, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/core';

const windowWidth = Dimensions.get('window').width;

export default function HeaderSell() {
    const navigation = useNavigation()
    const handleButton = () => navigation.navigate('SellProduct')

    return (
        <View style={styles.header}>
            <Button appearance='ghost' size='giant' onPress={handleButton}>
                <AntDesign name="pluscircleo" size={24} color="black" />
            </Button>
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        width: windowWidth * 0.88,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'flex-end'
    },
});