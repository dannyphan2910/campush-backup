import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, TextInput, View } from 'react-native';
import storage from '../storage/storage';
import { Input, Button } from '@ui-kitten/components';
import { useNavigation } from '@react-navigation/core';
import { db } from '../firebase'

export default function Login({ route, currentUser }) {
    console.log('LOGIN: ' + JSON.stringify(currentUser))
    const [email, setEmail] = useState("")
    const navigation = useNavigation();

    if (currentUser && (!route.params || route.params.currentUser)) {
        navigation.navigate('Back', { currentUser: currentUser })
        return null
    }

    const handleButton = e => {
        e.preventDefault()
        if (email) {
            storage.setCurrentUser(email)
                .then(success => {
                    if (success) {
                        storage.getCurrentUser()
                            .then(user => {
                                navigation.navigate('Back', { currentUser: user })
                                // db.ref('users/' + user.email.substring(0, user.email.indexOf("@"))).set(user)
                            })
                            .catch(err => console.error(err))
                    } else {
                        Alert.alert('No user found with email: ' + email)
                    }
                })
                .catch(err => console.error(err))
        }
    }

    const validateEmail = (input) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return input && re.test(String(input).toLowerCase());
    }

    return (
        <View style={styles.container}>
            <Image style={styles.image} source={require('../assets/Campush-logos.jpeg')} />
            <View style={styles.containerInput}>
                <View style={styles.inputView}>
                    <Input
                        style={styles.textInput}
                        placeholder="enter your email"
                        status={validateEmail(email) ? 'basic' : 'warning'}
                        onChangeText={(email) => setEmail(email)}
                    />
                </View>
                <Button
                    style={styles.button}
                    disabled={!(email && validateEmail(email))}
                    onPress={handleButton}
                    title="login"
                    color="black"
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: '50%'
    },
    containerInput: {
        alignItems: "center",
        justifyContent: "center",
    },
    inputView: {
        borderRadius: 30,
        width: "70%",
        height: 45,
        marginBottom: 20,
        alignItems: "center",
    },
    textInput: {
        width: '80%',
        flex: 1,
        marginTop: 15
    },
    image: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {

    }
});