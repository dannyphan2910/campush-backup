import { Button, Input, Text } from '@ui-kitten/components';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, TextInput } from 'react-native';
import { db } from '../../../firebase';

export default function SellProduct({ currentUser }) {
    const [name, setName] = useState("")
    const [price, setPrice] = useState(0)

    const handleSubmit = () => {
        var product = {
            name: name,
            price: parseInt(price),
            favorite_count: 0,
            thumbnail_url: 'https://via.placeholder.com/150',
            seller: currentUser.email.substring(0, currentUser.email.indexOf("@brandeis.edu")),
        }
        // db.ref('products/').set(object).then
    }

    return (
        <SafeAreaView style={styles.container}>
            <Input
                style={styles.input}
                onChangeText={setName}
                placeholder="Name"
            />
            <Input
                style={styles.input}
                onChangeText={setPrice}
                placeholder="Price"
                keyboardType="numeric"
                accessoryLeft={() => <Text>$</Text>}
            />
            <Button
                style={styles.button}
                onPress={handleSubmit}
                status='info'
            >
                Create Product
            </Button>
        </SafeAreaView>
    );
};
const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flex: 1,
        alignItems: 'center'
    },
    input: {
      height: 40,
      margin: 12,
      borderWidth: 1,
      padding: 10,
    },
    button: {
        margin: 50,
        width: '50%'
    }
  });

