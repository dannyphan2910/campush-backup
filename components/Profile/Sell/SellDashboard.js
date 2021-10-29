import { Card } from '@ui-kitten/components';
import React from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { FEATURED_PRODUCTS } from '../../../storage/data/products';


export default function SellDashboard() {

    const userProductsCards = (products) => {
        return products.map((product, index) => {
            return (
                <Card style={styles.card} key={product.id}>
                    <Image style={{ width: 100, height: 100 }} source={{ uri: product.thumbnail }} />
                    <View>
                        <Text>Name: {product.name}</Text>
                        <Text>Price: ${product.price}</Text>
                        <Text>
                            <Entypo name="heart" size={18} color="black" /> {product.favorite_count}
                        </Text>
                    </View>
                </Card>
            );
        })
    }


    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView>
                {userProductsCards(FEATURED_PRODUCTS)}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
    },
    card: {
        margin: 5,
        flexDirection: 'row'
    }
});
