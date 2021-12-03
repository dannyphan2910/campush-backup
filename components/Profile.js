import { useNavigation } from '@react-navigation/core';
import { Divider, Menu, MenuItem } from '@ui-kitten/components';
import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserContext } from '../context/user_context';
import storage from '../storage/storage';
import { CommonActions } from '@react-navigation/native';

export default function Profile() {
    const { setCurrentUser } = useContext(UserContext)
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <Menu style={{ backgroundColor: 'white' }}>
                <MenuItem
                    title={() => <Text style={{ paddingLeft: 10, fontSize: 20, fontWeight: '500' }}>Sell</Text>}
                    onPress={() => {
                        navigation.navigate('SellDashboard')
                    }}/>
                <MenuItem
                    title={() => <Text style={{ paddingLeft: 10, fontSize: 20, fontWeight: '500' }}>History</Text>}
                    onPress={() =>
                        navigation.navigate('History')
                    }/>
                <MenuItem
                    title={() => <Text style={{ paddingLeft: 10, fontSize: 20, fontWeight: '500' }}>About</Text>}
                    onPress={() =>
                        navigation.navigate('About')
                    }
                />
                <MenuItem
                    title={() => <Text style={{ paddingLeft: 10, fontSize: 20, fontWeight: '500', color: 'red' }}>Log out</Text>}
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
                <Divider style={{ width: 1 }} />
            </Menu>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingTop: 50
    },
});
