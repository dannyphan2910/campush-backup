import { useNavigation } from '@react-navigation/core';
import { Card, Layout, Button, Divider } from '@ui-kitten/components';
import { Feather } from '@expo/vector-icons';
import React, { useContext, useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, View, StatusBar, RefreshControl } from 'react-native';
import { UserContext } from '../context/user_context';
import { db } from '../firebase';

export default function Home() {
    const { currentUser } = useContext(UserContext)

    const navigation = useNavigation()

    const [featuredProducts, setFeatureProducts] = useState([])
    const [refresh, setRefresh] = useState(true)

    useEffect(() => {
        const getProducts = () => {
            db.collection('products').get()
                .then(
                    (querySnapshot) => {
                        if (!querySnapshot.empty) {
                            let products = []
                            querySnapshot.forEach((productSnapshot) => {
                                var random_boolean = Math.random() < 0.5;
                                if (!productSnapshot.get('purchased_by')) {
                                    if (random_boolean) {
                                        const product = productSnapshot.data();
                                        products.push(product)
                                    }
                                }
                            });
                            setFeatureProducts(products)
                        } else {
                            console.log('No products found')
                        }
                        setRefresh(false)
                    }
                )
                .catch(err => console.error(err))
        }
        getProducts()
    }, [refresh])

    if (!currentUser) {
        return null
    }

    const productsCards = (products) => {
        const Header = (props) => {
            const max = 18
            return (
                <View {...props} style={{ padding: 10 }}>
                    <Text style={styles.product_font} numberofLines={1}>{props.product.name.length > max ?
                        (props.product.name).substring(0,max-3) + '...' : props.product.name}</Text>
                    <Text style={styles.seller_font}>{props.product.sold_by.id}</Text>
                </View>
            )
        }
        const getCard = (product) => (
            <Card style={styles.card}
                key={product.id}
                header={(props) => <Header {...props} product={product} />}
                onPress={() => navigation.navigate('Product', { id: product.id })}>
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Image style={{ width: 100, height: 100 }} source={{ uri: product.thumbnail_url }} />
                </View>
            </Card>
        )
        let productsCards = []
        for (var i = 0; i < products.length-1; i+=2) {
            const product1 = products[i]
            const product2 = products[i+1]
            const card1 = getCard(product1)
            const card2 = getCard(product2)
            productsCards.push(
                <Layout style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }} 
                        level='1' 
                        key={product1.id.toString() + product2.id.toString()}>
                    {card1}
                    {card2}
                </Layout>
            )
        }
        return productsCards
    }

    const featuredProductsCards = productsCards(featuredProducts)

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <ScrollView style={{ width: '100%', paddingTop: 15 }} refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} />}>
                <View style={{ flex: 2, padding: 20, flexDirection: 'row' }}>
                    <View style={{ flex: 6, alignItems: 'flex-start', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 28, fontWeight: '600' }}>Hello, {currentUser.first_name} {currentUser.last_name}!</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Feather name="inbox" size={24} color="black" onPress={() => navigation.navigate('Inbox')} />
                    </View>
                </View>

                <View style={styles.body}>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <Text style={styles.header_font}>Featured Products</Text>
                    </View>

                    <View style={styles.bodyContainer}>
                        {featuredProductsCards}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bodyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        marginVertical: 5,
        width: '48%',
    },
    body: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginTop: 10,
    },
    header_font: {
        fontWeight: 'bold',
        fontSize: 20,
        paddingBottom: 10,
    },
    product_font: {
        // fontFamily: 'San Francisco',
        fontSize: 16,
        // padding: 5
    },
    seller_font: {
        fontSize: 10,
        // padding: 5
    }
});
