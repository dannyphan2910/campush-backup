import { useNavigation } from '@react-navigation/core';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Card, Menu, MenuItem } from '@ui-kitten/components';
import React from 'react';
import { Fragment } from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import storage from '../storage/storage';
import About from './Profile/About';

export default function Profile() {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Menu>
                <MenuItem title='User Profile'/>
                <MenuItem title='Favorite'/>
                <MenuItem title='Buy'/>
                <MenuItem
                    title='Sell'
                    onPress={() => {
                        navigation.navigate('SellDashboard')
                    }}/>
                <MenuItem title='Settings'/>
                <MenuItem
                    title='About'
                    onPress={() =>
                        navigation.navigate('About')
                    }
                />
                <MenuItem
                    title='Log out'
                    onPress={() => {
                        storage.removeCurrentUser()
                            .then(() => navigation.navigate('Login', { currentUser: null }))
                            .catch(err => console.error(err))
                    }}
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
