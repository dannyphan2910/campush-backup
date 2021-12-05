import { useNavigation } from '@react-navigation/core';
import { Card, Layout, Button, Divider } from '@ui-kitten/components';
import { Feather } from '@expo/vector-icons';
import React, { useContext, useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, View, StatusBar } from 'react-native';
import { UserContext } from '../context/user_context';
import { db } from '../firebase';

export default function Home() {
    const { currentUser } = useContext(UserContext)

    const navigation = useNavigation()

    const [featuredProducts, setFeatureProducts] = useState([])
    const [refresh, setRefresh] = useState(true)

    useEffect(() => {
        const getProducts = () => {
            db.ref('products').on('value',
                (querySnapshot) => {
                    if (querySnapshot.exists()) {
                        let products = []
                        querySnapshot.forEach((productSnapshot) => {
                            var random_boolean = Math.random() < 0.5;
                            if (!productSnapshot.hasChild('purchased_by')) {
                                if (random_boolean) {
                                    const product = productSnapshot.val();
                                    products.push(product)
                                }
                            }
                        });
                        setFeatureProducts(products)
                        setRefresh(false)
                    } else {
                        console.log('No products found')
                    }
                }
            )
        }
        getProducts()
    }, [refresh])

    // console.log('HOME: ' + JSON.stringify(currentUser))
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
                    <Text style={styles.seller_font}>{props.product.sold_by}</Text>
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
                <Layout style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }} level='1'>
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

            <ScrollView style={{ width: '100%' }}>
                <Text style={{padding: 20, fontSize: 28, fontWeight: '600',}}>Hello, {currentUser.first_name} {currentUser.last_name}!</Text>
                <View style={styles.body}>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <View style={{ flex: 5 }}>
                            <Text style={styles.header_font}>Featured Products</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Button appearance='ghost' size='medium' onPress={() => setRefresh(true)}>
                                <Feather name="refresh-ccw" size={22} color="black" />
                            </Button>
                        </View>
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
