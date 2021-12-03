import { useNavigation } from "@react-navigation/core";
import { firebaseStorage } from "../firebase";
import React from 'react';
import { Card } from "@ui-kitten/components";
import { Image, Text, View } from "react-native";

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

    getProductCardsLong: (products) => {
        const navigation = useNavigation()

        return products.map((product, index) => {
            return (
                <Card style={{ margin: 5 }} key={product.id} onPress={() => navigation.navigate('Product', { id: product.id })}>
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <View style={{ flex: 2, justifyContent: 'center' }}>
                            <Image style={{ width: 100, height: 100 }} source={{ uri: product.thumbnail_url }} />
                        </View>
                        <View style={{ flex: 3, justifyContent: 'space-between' }}>
                            <Text>Name: {product.name}</Text>
                            <Text>Price: ${product.price}</Text>
                        </View>
                    </View>
                </Card>
            );
        })
    }
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
    }
}