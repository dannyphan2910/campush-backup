import { useNavigation } from '@react-navigation/core';
import { Menu, MenuItem } from '@ui-kitten/components';
import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import storage from '../storage/storage';

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
