import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Button } from '@ui-kitten/components';
import { Dimensions, StatusBar, StyleSheet, View } from 'react-native';

const windowWidth = Dimensions.get('window').width;

export default function Header() {

    return (
        <View style={styles.header}>
            <Button appearance='ghost' size='giant'>
                <Feather name="shopping-bag" size={24} color="black" />
            </Button>
        </View>
    );
  }

const styles = StyleSheet.create({
    header: {
        width: windowWidth - 25,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'flex-end'
    },
});