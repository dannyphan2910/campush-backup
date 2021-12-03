import { Card } from '@ui-kitten/components';
import React, { useContext } from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { UserContext } from '../context/user_context';
import { UserHelper } from '../helper/helper';
import { FEATURED_PRODUCTS, POPULAR_PRODUCTS } from '../storage/data/products';

export default function Home() {
    const { currentUser } = useContext(UserContext)

    console.log('HOME: ' + JSON.stringify(currentUser))
    if (!currentUser) {
        return null
    }

    const productsCards = (products) => {
        return products.map((product, index) => {
            const Header = (props) => (
                <View {...props}>
                    <Text style={styles.product_font}>{product.name}</Text>
                    <Text style={styles.seller_font}>{product.seller.first_name} {product.seller.last_name}</Text>
                </View>
            );
            let specialStyle = {};
            if (index === 0) {
                specialStyle = { marginLeft : 0 };
            } else if (index === products.length-1) {
                specialStyle = { marginRight : 0 };
            }
            return (
                <Card style={[styles.card, specialStyle]} key={product.id} header={Header}>
                    <Image style={{ width: 100, height: 100 }} source={{ uri: product.thumbnail }} />
                </Card>
            );
        })
    }

    const featuredProductsCards = productsCards(FEATURED_PRODUCTS)
    const popularProductsCards = productsCards(POPULAR_PRODUCTS)

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollview}>
                <StatusBar barStyle="dark-content" />
                <Text>Hello, {currentUser.first_name} {currentUser.last_name}!</Text>
                <View style={styles.body}>
                    <Text style={styles.header_font}>Featured Products</Text>
                        <ScrollView horizontal={true}>
                            {featuredProductsCards}
                        </ScrollView>
                    <Text style={styles.header_font}>Popular Products</Text>
                        <ScrollView horizontal={true}>
                            {popularProductsCards}
                        </ScrollView>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        minHeight: '100%',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        margin: 5,
    },
    body: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    header_font: {
        fontWeight: 'bold',
        fontSize: 20,
        paddingTop: 30,
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
