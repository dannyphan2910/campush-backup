import { useNavigation } from "@react-navigation/core";
import { firebaseStorage } from "../firebase";
import React from 'react';
import { Card, Text } from "@ui-kitten/components";
import { Image, View } from "react-native";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export const UserHelper = {
    getUsername: (email) => email.substring(0, email.indexOf("@brandeis.edu"))
}

export const GeneralHelper = {
    getRandomID: () => {
        const s4 = () => {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        //return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },

    getProductCardsLong: (products, styles={}) => {
        const navigation = useNavigation()

        return products.map((product) => (
            <Card style={[{ margin: 5 }, styles]} key={product.id} onPress={() => navigation.navigate('Product', { id: product.id })}>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                    <View style={{ flex: 2, justifyContent: 'center' }}>
                        <Image style={{ width: 100, height: 100 }} source={{ uri: product.thumbnail_url }} />
                    </View>
                    <View style={{ flex: 3, justifyContent: 'space-between' }}>
                        <Text><Text category='s1'>Name: </Text>{product.name}</Text>
                        <Text><Text category='s1'>Price: </Text>${GeneralHelper.numberWithCommas(product.price)}</Text>
                    </View>
                </View>
            </Card>
        ))
    },

    numberWithCommas: (x) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
    roundedBy2: (num) => Math.round((num + Number.EPSILON) * 100) / 100,
}

export const ImageHelper = {
    uploadImageAsync: async (uri) => {
        // Why are we using XMLHttpRequest? See:
        // https://github.com/expo/expo/issues/2402#issuecomment-443726662
        const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                resolve(xhr.response);
            };
            xhr.onerror = function (e) {
                console.log(e);
                reject(new TypeError("Network request failed"));
            };
            xhr.responseType = "blob";
            xhr.open("GET", uri, true);
            xhr.send(null);
        });

        const fileRef = firebaseStorage.ref().child(new Date().toISOString());
        await fileRef.put(blob);

        // We're done with the blob, close and release it
        blob.close();

        return await fileRef.getDownloadURL();
    },

    compressImage: async (uri) => {
        const manipResult = await manipulateAsync(
            uri,
            [{ resize: { height: 500, width: 500 } }],
            { compress: 0.8, format: SaveFormat.PNG }
          );
        return manipResult.uri
    }
}

export const CartHelper = {

    getTotalCost: (products) => {
        const sum = products.reduce(( sum, { price } ) => sum + price , 0)
        const subtotal = GeneralHelper.roundedBy2(sum)
        const fees = GeneralHelper.roundedBy2(sum * 0.075)
    
        return {
            subtotal: GeneralHelper.numberWithCommas(subtotal),
            fees: GeneralHelper.numberWithCommas(fees),
            total: GeneralHelper.numberWithCommas(GeneralHelper.roundedBy2(subtotal + fees)),
        }
    }
}