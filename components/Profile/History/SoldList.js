import React, { useContext, useEffect, useState } from 'react'
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { UserContext } from '../../../context/user_context'
import { db } from '../../../firebase'
import { GeneralHelper } from '../../../helper/helper'

export default function SoldList() {
    const { currentUser } = useContext(UserContext)

    const [soldProducts, setSoldProducts] = useState([])
    const [refresh, setRefresh] = useState(true)

    useEffect(() => {
        const getSoldProducts = () => {
            if (currentUser) {
                db.collection('users_products').doc(currentUser.username).get()
                    .then(snapshot => {
                        if (snapshot.exists) {
                            const inactiveProductsRefs = snapshot.get('inactive')
                            if (inactiveProductsRefs) {
                                const productPromises = inactiveProductsRefs.map((productRef) => {
                                    return productRef.get()
                                })
                                Promise.all(productPromises).then(productSnapshots => {
                                    const productsFound = productSnapshots.map(productSnapshot => productSnapshot.data()).reverse()
                                    setSoldProducts(productsFound)
                                })
                            }
                        } else {
                            console.log('No inactive products found for username ' + currentUser.username)
                        }
                        setRefresh(false)
                    })
            }
        }
        getSoldProducts()
    }, [refresh])

    const noProductsView = (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>No products sold. Let's be patient!</Text>
        </View>
    )

    const productsView = (
        <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} />}>
            {GeneralHelper.getProductCardsLong(soldProducts)}
        </ScrollView>
    )

    const getProductCards = soldProducts.length > 0 ?
                            productsView :
                            noProductsView

    return (
        <SafeAreaView style={styles.container}>
            {getProductCards}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'white'
    }
});