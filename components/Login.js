import React, { useContext, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import storage from '../storage/storage';
import { Input, Button } from '@ui-kitten/components';
import { useNavigation } from '@react-navigation/core';
import { db } from '../firebase'
import { UserContext } from '../context/user_context';
import { CommonActions } from '@react-navigation/native';

export default function Login() {
    const { currentUser, setCurrentUser } = useContext(UserContext)

    const [email, setEmail] = useState("")
    const navigation = useNavigation();

    if (currentUser) {
        navigation.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }]
        }))
        return null
    }

    const handleButton = () => {
        if (email) {
            db.collection('users').where('email', '==', email).limit(1).get()
                .then((snapshot) => {
                    if (snapshot.empty) {
                        Alert.alert('No user found with email: ' + email)
                    } else {
                        let user = undefined
                        snapshot.forEach((userSnapshot) => {
                            user = userSnapshot.data()
                        })
                        if (user) {
                            storage.setCurrentUser(user)
                                .then(() => {
                                    setCurrentUser(user)
                                    navigation.navigate('Main')
                                })
                                .catch(err => console.error(err))
                            }
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
                        keyboardType="email-address"
                    />
                </View>
                <Button
                    style={styles.button}
                    disabled={!(email && validateEmail(email))}
                    onPress={handleButton}
                >
                    Login
                </Button>
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