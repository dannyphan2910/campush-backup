import { useNavigation } from '@react-navigation/core';
import { Avatar, Divider, Menu, MenuItem } from '@ui-kitten/components';
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserContext } from '../context/user_context';
import storage from '../storage/storage';
import { CommonActions } from '@react-navigation/native';
import { GeneralHelper, UserHelper } from '../helper/helper';
import { db } from '../firebase';

export default function Profile() {
    const { currentUser, setCurrentUser } = useContext(UserContext)
    const navigation = useNavigation();

    const [purchasedCount, setPurchasedCount] = useState(0)
    const [sellCount, setSellCount] = useState(0)
    const [soldCount, setSoldCount] = useState(0)

    useEffect(() => {
        const getCount = () => {
            if (currentUser) {
                db.collection('users_products').doc(currentUser.username)
                    .onSnapshot(snapshot => {
                        if (snapshot.exists) {
                            const activeProductsRefs = snapshot.get('active')
                            if (activeProductsRefs) setSellCount(activeProductsRefs.length)

                            const inactiveProductsRefs = snapshot.get('inactive')
                            if (inactiveProductsRefs) setSoldCount(inactiveProductsRefs.length)
                        }
                    })

                db.collection('users_purchases').doc(currentUser.username)
                    .onSnapshot(snapshot => {
                        if (snapshot.exists) {
                            const purchasesRef = snapshot.get('products')
                            if (purchasesRef) setPurchasedCount(purchasesRef.length)
                        }
                    })
            }
        }
        getCount()
    }, [])
    
    if (!currentUser) {
        return null
    }

    const countSection = ((titles, counts) => {
        const getTextView = (text, textWeight) => (
            <View   key={GeneralHelper.getRandomID()}
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center', 
                            borderLeftColor: 'black', borderLeftWidth: 0.2,
                            borderRightColor: 'black', borderRightWidth: 0.2 }}>
                <Text style={{ fontSize: 18, fontWeight: textWeight, marginTop: 5 }}>{text}</Text>
            </View>
        )
        return (
            <>
                <View style={{ flexDirection: 'row' }}>
                    {titles.map(title => getTextView(title, '400'))}
                </View>
                <View style={{ flexDirection: 'row' }}>
                    {counts.map(count => getTextView(count, '200'))}
                </View>
            </>
        )
    })(['Purchased', 'Sell', 'Sold'], [purchasedCount, sellCount, soldCount])

    return (
        <View style={styles.container}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Avatar source={{ uri: currentUser.avatar_url }} size='giant' />
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', margin: 10 }}>
                    <Text style={{ fontSize: 30, fontWeight: '600' }}>{currentUser.first_name} {currentUser.last_name}</Text>
                </View>
                {countSection}
            </View>
            <View style={{ flex: 3 }}>
                <Menu style={{ backgroundColor: 'white' }}>
                    <MenuItem
                        title={() => <Text style={{ paddingLeft: 10, fontSize: 20, fontWeight: '500' }}>Account</Text>}
                        onPress={() => {
                            navigation.navigate('Account')
                        }}/>
                    <MenuItem
                        title={() => <Text style={{ paddingLeft: 10, fontSize: 20, fontWeight: '500' }}>Payment</Text>}
                        onPress={() => {
                            navigation.navigate('Payment')
                        }}/>
                    <MenuItem
                        title={() => <Text style={{ paddingLeft: 10, fontSize: 20, fontWeight: '500' }}>Favorites</Text>}
                        onPress={() => {
                            navigation.navigate('Favorites')
                        }}/>
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
