import { useNavigation } from '@react-navigation/core';
import { Menu, MenuItem } from '@ui-kitten/components';
import React, { useContext } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { UserContext } from '../context/user_context';
import storage from '../storage/storage';
import { CommonActions } from '@react-navigation/native';

export default function Profile() {
    const { setCurrentUser } = useContext(UserContext)
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Menu>
                <MenuItem title='User Profile'/>
                <MenuItem title='Favorites'/>
                <MenuItem
                    title='Sell'
                    onPress={() => {
                        navigation.navigate('SellDashboard')
                    }}/>
                <MenuItem
                    title='History'
                    onPress={() =>
                        navigation.navigate('History')
                    }/>
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
                            .then(() => {
                                setCurrentUser(null)
                                navigation.dispatch(CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }]
                                }))
                            })
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
