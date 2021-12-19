import React, { useContext, useEffect, useState } from 'react'
import { Alert, Keyboard, KeyboardAvoidingView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import { CardField, useConfirmSetupIntent, initStripe } from '@stripe/stripe-react-native'
import { Button, Input } from '@ui-kitten/components';
import { UserContext } from '../../context/user_context';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

export default function Payment() {
    const { currentUser } = useContext(UserContext)

    const { confirmSetupIntent, loading } = useConfirmSetupIntent();
    const [card, setCard] = useState({})
    const [setupIntent, setSetupIntent] = useState(null);

    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [country, setCountry] = useState('')
    const [postalCode, setPostalCode] = useState('')

    useEffect(() => {
        initStripe({
            publishableKey: 'pk_test_51K78wDBXa70L4pYtnzSfk0aVYDvTSPNvuNtvWj45i2MeGVs4HrJwwwOVnbLxP3Um8MC5buAiLmWeh2zGH74GDkIP00wXIaquEa',
            urlScheme: Constants.appOwnership === 'expo' ? Linking.createURL('/--/') : Linking.createURL(''),
        });
    }, [])

    const handleSave = async () => {
        const createSetupIntentOnBackend = async () => {
            const response = await fetch(`https://api.stripe.com/v1/create-setup-intent`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email: currentUser.email }),
            });
            const { clientSecret } = await response.json();
        
            return clientSecret;
          };
        // 1. fetch Intent Client Secret from backend
        const clientSecret = await createSetupIntentOnBackend();  
        // 2. Gather customer billing information (ex. email)
        const billingDetails = {
            email: currentUser.email,
            phone: '+17817809809',
            addressCity: city,
            addressCountry: country,
            addressLine1: address,
            addressPostalCode: postalCode,
        };      
        // 3. Confirm setup intent
        const { error, setupIntent: setupIntentResult } = await confirmSetupIntent(
            clientSecret,
            {
                type: 'Card',
                billingDetails,
            }
        );
    
        if (error) {
            Alert.alert(`Error code: ${error.code}`, error.message);
            console.log('Setup intent confirmation error', error.message);
        } else if (setupIntentResult) {
            Alert.alert(
                'Success',
                `Setup intent created. Intent status: ${setupIntentResult.status}`
            );
    
            setSetupIntent(setupIntentResult);
        }
    }

    return (
        <KeyboardAvoidingView style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <View style={{ }}>
                        <Text style={styles.title}>Card</Text>
                        <CardField 
                            postalCodeEnabled={false}
                            placeholder={{ 'number': '4242 4242 4242 4242' }}
                            onCardChange={(cardDetails) => { console.log('card details', cardDetails); setCard(cardDetails);}}
                            cardStyle={styles.inputStyles}
                            style={styles.cardField}
                        />
                    </View>
                    <View style={{ }}>
                        <Text style={styles.title}>Billing Address</Text>
                        <Input 
                            style={styles.input}
                            onChangeText={setAddress}
                            value={address}
                        />
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text style={styles.title}>City</Text>
                            <Input 
                                style={styles.input}
                                onChangeText={setCity}
                                value={city}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text style={styles.title}>State</Text>
                            <Input 
                                style={styles.input}
                                onChangeText={setState}
                                value={state}
                            />
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text style={styles.title}>Country</Text>
                            <Input 
                                style={styles.input}
                                onChangeText={setCountry}
                                value={country}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text style={styles.title}>Zip Code</Text>
                            <Input 
                                style={styles.input}
                                onChangeText={setPostalCode}
                                value={postalCode}
                            />
                        </View>
                    </View>
                    <Button style={{ marginVertical: 15 }} onPress={handleSave} disabled={loading}>Save Card</Button>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 10,
    },
    inputStyles: {
        borderWidth: 1,
        backgroundColor: '#FFFFFF',
        borderColor: '#D8D8D8',
        borderRadius: 6,
        fontSize: 14,
    },
    cardField: {
        // flex: 1,
        width: '100%',
        height: 50,
    },
    title: {
        marginVertical: 5,
        fontSize: 15,
        color: 'grey',
        marginTop: 15
    },
    input: { 
        backgroundColor: 'white',
        borderColor: '#D8D8D8',
    }
}) 