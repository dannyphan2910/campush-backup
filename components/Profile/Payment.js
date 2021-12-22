import React, { useContext, useEffect, useState } from 'react'
import { Alert, Dimensions, Keyboard, KeyboardAvoidingView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import { CardField, useConfirmSetupIntent } from '@stripe/stripe-react-native'
import { Button, Card, Input, Select, SelectItem } from '@ui-kitten/components';
import { UserContext } from '../../context/user_context';
import { db } from '../../firebase';
import storage from '../../storage/storage';
import { Ionicons, Fontisto, MaterialCommunityIcons } from '@expo/vector-icons'; 
import { GeneralHelper } from '../../helper/helper';

const windowWidth = Dimensions.get('window').width;
const LAMBDA_URL = 'https://j0uhzvsibf.execute-api.us-east-2.amazonaws.com/'

export default function Payment() {
    const { currentUser, setCurrentUser } = useContext(UserContext)

    const [refresh, setRefresh] = useState(true)

    const [paymentMethods, setPaymentMethods] = useState([])

    useEffect(() => {
        const retrievePaymentMethods = async () => {
            if (currentUser.stripe_customer_id) {
                var response = await fetch(`${LAMBDA_URL}/retrieve_payment_methods`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        customer_id: currentUser.stripe_customer_id
                    }),
                })
                const { data } = await response.json()
                setPaymentMethods(data)
                setRefresh(false)
            }
        }
        retrievePaymentMethods()
    }, [refresh, currentUser.has_payment])

    if (!currentUser.stripe_customer_id || !currentUser.has_payment 
        || !paymentMethods || paymentMethods.length == 0) {
        return <AddPaymentCard />
    }
    
    const detachPaymentMethod = (id) => {
        console.log(currentUser.stripe_customer_id, id)
        if (currentUser.stripe_customer_id) {
            fetch(`${LAMBDA_URL}/detach_payment_method`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    payment_method_id: id
                }),
            })
            .then(() => { 
                db.collection('users').doc(currentUser.username).update({ has_payment: false })
                let curr = Object.assign({}, currentUser)
                const newUserInfo = {
                    ...curr,
                    has_payment: false
                }
                storage.setCurrentUser(newUserInfo)
                    .then((success) => {
                        if (success) {
                            setCurrentUser(newUserInfo)
                        }
                    })
                setRefresh(true)
            })
            .catch(err => console.error(err))
        }
    }

    const handleReplace = (id) => {
        Alert.alert(
            'Are you sure?', 
            'Choosing to replace this card will detach this payment method. This change cannot be reversed.',     
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Remove Card",
                    onPress: () => detachPaymentMethod(id),
                    style: "destructive",
                },
            ],
            {
                cancelable: true,
            }
        )
    }

    const paymentCardList = paymentMethods.map(paymentMethod => {
        const { id, card } = paymentMethod
        console.log(id, card)

        let iconName = 'credit-card'
        switch(card.brand) {
            case 'visa': iconName = 'visa'; break;
            case 'mastercard': iconName = 'mastercard'; break;
            case 'discover': iconName = 'discover'; break;
            case 'amex': iconName = 'american-express'; break;
            case 'jcb': iconName = 'jcb'; break;
        }

        let ccNumText = []
        for (var i = 0; i < 3; i++) {
            ccNumText.push(
                <Text style={{ color: 'white', fontSize: 18, marginRight: 15, letterSpacing: 1 }}>
                    &#8226; &#8226; &#8226; &#8226; 
                </Text>
            )
        }
        ccNumText.push(
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 1  }}>
                {card.last4}
            </Text>
        )

        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} key={paymentMethod.id}>
                <View style={{ flex: 2, justifyContent: 'center', alignItems: 'center' }}>
                    <Card style={{ flex: 1, maxHeight: 200, minWidth: windowWidth*0.8, backgroundColor: 'black', borderRadius: 15 }}>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>  
                            <View style={{ flex: 1, alignSelf: 'flex-start' }}>
                                <Fontisto name={iconName} size={24} color="white" />
                            </View>
                            <View style={{ flex: 1, flexDirection: 'row' }}>
                                <Ionicons name="hardware-chip-outline" size={35} color="white" style={{ flex: 1, alignSelf: 'flex-start' }} />
                                <MaterialCommunityIcons name="contactless-payment" size={30} color="white" />
                            </View>
                            <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                {ccNumText}
                            </View>
                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '200' }}>Cardholder Name</Text>
                                    <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{currentUser.first_name} {currentUser.last_name}</Text>
                                </View>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '200' }}>Expiration Date</Text>
                                    <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{("0" + card.exp_month).slice(-2)}/{card.exp_year.toString().slice(-2)}</Text>
                                </View>
                            </View>
                        </View>
                    </Card>
                </View>
                <View style={{ flex: 1 }}>
                    <Button style={{ marginVertical: 15, backgroundColor: 'black', borderWidth: 0 }} onPress={() => handleReplace(id)}>Replace This Card</Button>
                </View>
            </View>
        )
    })


    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'white'  }}>
            {paymentCardList}
        </View>   
    )
}


function AddPaymentCard() {
    const { currentUser, setCurrentUser } = useContext(UserContext)

    const { confirmSetupIntent, loading } = useConfirmSetupIntent();
    const [card, setCard] = useState()

    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [country, setCountry] = useState('US')
    const [postalCode, setPostalCode] = useState('')

    const handleSave = async () => {
        const getStripeCustomerId = async () => {
            if (!currentUser.stripe_customer_id) {
                var response = await fetch(`${LAMBDA_URL}/create_new_customer`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        email: currentUser.email, 
                        name: `${currentUser.first_name} ${currentUser.last_name}` 
                    }),
                })

                const { id } = await response.json()
                return id
            } else {
                return currentUser.stripe_customer_id
            }
        }

        const createSetupIntentOnBackend = async (customerId) => {
            var response = await fetch(`${LAMBDA_URL}/create_setup_intents`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ customer_id: customerId }),
              });
            const data = await response.json();
            const { client_secret } = data
            console.log(data)
            return client_secret;
        }

        // 1. fetch user's Stripe Customer ID
        const customerId = await getStripeCustomerId()
        console.log(customerId)
        // 2. fetch Intent Client Secret from backend - create a Customer object if not available
        const clientSecret = await createSetupIntentOnBackend(customerId);  
        // 3. Gather customer billing information (ex. email)
        const billingDetails = {
            email: currentUser.email,
            addressCity: city,
            addressCountry: country,
            addressLine1: address,
            addressPostalCode: postalCode,
            addressState: state
        };      
        // 4. Confirm setup intent
        const { error } = await confirmSetupIntent(
            clientSecret,
            {
                type: 'Card',
                billingDetails,
            }
        );
            
        var has_payment = false
        if (error) {
            Alert.alert(`Error code: ${error.code}`, error.message);
            console.error('Setup intent confirmation error', error.message);
        } else {
            has_payment = true
            db.collection('users').doc(currentUser.username).update(
                { stripe_customer_id: customerId, has_payment: has_payment }
            )
            let curr = Object.assign({}, currentUser)
            const newUserInfo = {
                ...curr,
                stripe_customer_id: customerId,
                has_payment: has_payment
            }
            storage.setCurrentUser(newUserInfo)
                .then((success) => {
                    if (success) {
                        setCurrentUser(newUserInfo)
                    }
                })
        }
    }

    const buttonDisabled = loading || !card || !card.complete
        || !(address.length > 0 && city.length > 0 && state.length > 0 && postalCode.length > 0)

    console.log(state)

    return (
        <KeyboardAvoidingView style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <View style={{ }}>
                        <Text style={styles.title}>Card</Text>
                        <CardField 
                            postalCodeEnabled={false}
                            placeholder={{ 'number': '4242 4242 4242 4242' }}
                            onCardChange={(cardDetails) => setCard(cardDetails)}
                            cardStyle={styles.inputStyles}
                            style={styles.cardField}
                        />
                    </View>
                    <View style={{ }}>
                        <Text style={styles.title}>Billing Address</Text>
                        <Input 
                            placeholder='Address'
                            style={styles.input}
                            onChangeText={setAddress}
                            value={address}
                        />
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text style={styles.title}>City</Text>
                            <Input 
                                placeholder='City'
                                style={styles.input}
                                onChangeText={setCity}
                                value={city}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text style={styles.title}>State</Text>
                            <Select 
                                placeholder='State'
                                value={state}
                                onSelect={index => setState(GeneralHelper.US_STATES[index-1]['name'])}>
                                {GeneralHelper.US_STATES.map(stateObj => (
                                    <SelectItem 
                                        title={stateObj['name']} 
                                        key={stateObj['abbreviation']} />
                                ))}
                            </Select>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text style={styles.title}>Country</Text>
                            <Input 
                                disabled
                                style={styles.input}
                                value={country}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text style={styles.title}>Zip Code</Text>
                            <Input 
                                placeholder='Zip Code'
                                keyboardType='number-pad'
                                style={styles.input}
                                onChangeText={setPostalCode}
                                value={postalCode}
                            />
                        </View>
                    </View>
                    <Button style={{ marginVertical: 15 }} onPress={handleSave} disabled={buttonDisabled}>Save Card</Button>
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