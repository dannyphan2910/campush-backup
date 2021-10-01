import { useNavigation } from '@react-navigation/core';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Card, Menu, MenuItem } from '@ui-kitten/components';
import React from 'react';
import { Fragment } from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import About from './About';

export default function Profile() {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Menu>
                <MenuItem title='User Profile'/>
                <MenuItem title='Favorite'/>
                <MenuItem title='Bought'/>
                <MenuItem title='Sold'/>
                <MenuItem title='Settings'/>
                <MenuItem
                    title='About'
                    onPress={() =>
                        navigation.navigate('About')
                    }
                />
            </Menu>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // flexDirection: 'column',
    },
});
