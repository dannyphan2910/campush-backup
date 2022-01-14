import { useNavigation } from '@react-navigation/core';
import { Divider} from '@ui-kitten/components';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GeneralHelper, ProductHelper } from '../helper/helper';
import { db } from '../firebase';
import CachedImage from './CachedImage';

const TOP_COUNT = 10

export default function SellerProfile({ route }) {
    const { user } = route.params
    const navigation = useNavigation();

    const [purchasedCount, setPurchasedCount] = useState(0)
    const [sellCount, setSellCount] = useState(0)
    const [soldCount, setSoldCount] = useState(0)

    const [topProducts, setTopProducts] = useState([])

    useEffect(() => {
        const getCount = () => {
            if (user) {
                db.collection('users_products').doc(user.username)
                    .onSnapshot(snapshot => {
                        if (snapshot.exists) {
                            const activeProductsRefs = snapshot.get('active')
                            if (activeProductsRefs) setSellCount(activeProductsRefs.length)

                            const inactiveProductsRefs = snapshot.get('inactive')
                            if (inactiveProductsRefs) setSoldCount(inactiveProductsRefs.length)
                        }
                    })

                db.collection('users_purchases').doc(user.username)
                    .onSnapshot(snapshot => {
                        if (snapshot.exists) {
                            const purchasesRef = snapshot.get('products')
                            if (purchasesRef) setPurchasedCount(purchasesRef.length)
                        }
                    })
            }
        }
        
        const getTopProducts = (num) => {
            if (user) {
                const userRef = db.collection('users').doc(user.username)

                db.collection('products')
                    .where('sold_by', '==', userRef)
                    .where('is_purchased', '==', false)
                    .orderBy('favorited_count', 'desc')
                    .limit(num)
                    .get()
                    .then(snapshots => {
                        if (!snapshots.empty) {
                            let products = []
                            console.log(snapshots.size)
                            snapshots.forEach(snapshot => {
                                const data = snapshot.data()
                                products.push(data)
                            })
                            setTopProducts(products)
                        } else {
                            console.log('No products available for user: ' + user.username)
                        }
                    })
                    .catch(err => console.error(err))
            }
        }
        
    
        getCount()
        getTopProducts(TOP_COUNT)
        navigation.setOptions({ headerTitle: user.username })
    }, [])
    
    if (!user) {
        return null
    }

    const countSection = ((titles, counts) => {
        const getColumnView = (title, count) => (
            <View 
                key={GeneralHelper.getRandomID()}
                style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center',
                        borderLeftColor: 'black', borderLeftWidth: 0.2,
                        borderRightColor: 'black', borderRightWidth: 0.2 }} >
               <Text style={{ fontSize: 18, fontWeight: '400' }}>{title}</Text>
               <Text style={{ fontSize: 18, fontWeight: '200' }}>{count}</Text>
            </View>
        )

        return (
            <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 10 }}>
                {titles.map((title, index) => getColumnView(title, counts[index]))}
            </View>
        )

    })(['Purchased', 'Sell', 'Sold'], [purchasedCount, sellCount, soldCount])

    const productCards = ProductHelper.getProductCardsLong(topProducts)

    return (
        <View style={styles.container}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ flex: 3, justifyContent: 'center', alignItems: 'center' }}>
                    <CachedImage source={{ uri: user.avatar_url }} style={styles.avatar}  />
                    <Text style={{ fontSize: 30, fontWeight: '600', marginTop: 10 }}>{user.first_name} {user.last_name}</Text>
                </View>
                {countSection}
            </View>
            <Divider style={{ width: '100%' }} />
            <View style={{ flex: 2, alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '500', marginVertical: 10 }}>TOP {TOP_COUNT} ACTIVE PRODUCTS</Text>
                <Divider style={{ width: '80%' }} />
                <ScrollView style={{ width: '100%' }}>
                    {productCards}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    avatar: {
        width: 75, 
        height: 75,
        borderRadius: 75/2
    }
});
