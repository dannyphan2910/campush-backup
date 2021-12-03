import React from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';


export default function About() {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <StatusBar barStyle="dark-content" />
                    <View style= {styles.about}>
                        <Text style= {styles.about}>Campush is a campus e-commerce platform for college students to sell and buy</Text>
                        <Image style= {styles.image} source={require('../../assets/Campush-logos.jpeg')} />
                    </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flex: 1,
        // flexDirection: 'column',
    },
    about: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        fontStyle: 'italic',
        fontSize: 24,
        padding: 20,
    },
    image: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
