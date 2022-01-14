import { useNavigation } from "@react-navigation/core";
import { db, firebaseStorage } from "../firebase";
import React, { useContext } from 'react';
import { Card, Divider, Text } from "@ui-kitten/components";
import { Dimensions, Pressable, View } from "react-native";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { FontAwesome } from '@expo/vector-icons';
import CachedImage from "../components/CachedImage";
import { UserContext } from "../context/user_context";

export const ProductHelper = {
    getProductCardsLong: (products, styles={}, onPress=undefined, onLongPress=(product)=>{}) => {
        const navigation = useNavigation()

        let handleOnPress = (product) => {
          if (onPress) {
            onPress(product)
          } else {
            navigation.navigate('Product', { id: product.id })
          }
        }

        return products.map((product) => (
            <Card style={[{ margin: 5, backgroundColor: 'white' }, styles]} 
                  key={product.id} 
                  onPress={() => handleOnPress(product)} 
                  onLongPress={() => onLongPress(product)}>
                <View style={{ flex: 1, flexDirection: 'row', opacity: product.purchased_by ? 0.2 : 1 }}>
                    <View style={{ flex: 2, justifyContent: 'center', minWidth: 100 }}>
                        <CachedImage style={{ width: 100, height: 100 }} source={{ uri: product.thumbnail_urls[0] }} />
                    </View>
                    <View style={{ flex: 15, justifyContent: 'space-between' }}>
                        <Text numberOfLines={1}><Text category='s1'>Name: </Text>{product.name}</Text>
                        <Text numberOfLines={1}><Text category='s1'>Price: </Text>${GeneralHelper.numberWithCommas(product.price)}</Text>
                        <Text numberOfLines={1}><FontAwesome name="heart" size={10} color="black" /> {product.favorited_count}</Text>
                    </View>
                </View>
            </Card>
        ))
    },

    CONDITIONS: [
      {
        'name': 'New',
        'description': 'Perfect condition, never used.'
      },
      {
        'name': 'Used - Like New',
        'description': 'Item has never been used. It looks and functions identical to a New item (as defined above), but item may not come in the original package.'
      },
      {
        'name': 'Used - Very Good',
        'description': 'Item looks and functions as if it were new, but may have light marks or scratches. Accessories, manuals, cables and software may not be included with the item.'
      },
      {
        'name': 'Used - Good',
        'description': 'Item works as new. Minimal cosmetic damage to product. Some wear and tear but not excessive. Some non-basic components may be missing.'
      },
      {
        'name': 'Used - Acceptable',
        'description': 'The most important functions of the item work as new. Functions that do not work should be described in detail in the description. May have some damage; some non-basic components may be missing.'
      },
    ]
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

    numberWithCommas: (x) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
    roundedBy2: (num) => Math.round((num + Number.EPSILON) * 100) / 100,

    US_STATES: [
        {
          "name": "Alabama",
          "abbreviation": "AL"
        },
        {
          "name": "Alaska",
          "abbreviation": "AK"
        },
        {
          "name": "American Samoa",
          "abbreviation": "AS"
        },
        {
          "name": "Arizona",
          "abbreviation": "AZ"
        },
        {
          "name": "Arkansas",
          "abbreviation": "AR"
        },
        {
          "name": "California",
          "abbreviation": "CA"
        },
        {
          "name": "Colorado",
          "abbreviation": "CO"
        },
        {
          "name": "Connecticut",
          "abbreviation": "CT"
        },
        {
          "name": "Delaware",
          "abbreviation": "DE"
        },
        {
          "name": "District Of Columbia",
          "abbreviation": "DC"
        },
        {
          "name": "Federated States Of Micronesia",
          "abbreviation": "FM"
        },
        {
          "name": "Florida",
          "abbreviation": "FL"
        },
        {
          "name": "Georgia",
          "abbreviation": "GA"
        },
        {
          "name": "Guam",
          "abbreviation": "GU"
        },
        {
          "name": "Hawaii",
          "abbreviation": "HI"
        },
        {
          "name": "Idaho",
          "abbreviation": "ID"
        },
        {
          "name": "Illinois",
          "abbreviation": "IL"
        },
        {
          "name": "Indiana",
          "abbreviation": "IN"
        },
        {
          "name": "Iowa",
          "abbreviation": "IA"
        },
        {
          "name": "Kansas",
          "abbreviation": "KS"
        },
        {
          "name": "Kentucky",
          "abbreviation": "KY"
        },
        {
          "name": "Louisiana",
          "abbreviation": "LA"
        },
        {
          "name": "Maine",
          "abbreviation": "ME"
        },
        {
          "name": "Marshall Islands",
          "abbreviation": "MH"
        },
        {
          "name": "Maryland",
          "abbreviation": "MD"
        },
        {
          "name": "Massachusetts",
          "abbreviation": "MA"
        },
        {
          "name": "Michigan",
          "abbreviation": "MI"
        },
        {
          "name": "Minnesota",
          "abbreviation": "MN"
        },
        {
          "name": "Mississippi",
          "abbreviation": "MS"
        },
        {
          "name": "Missouri",
          "abbreviation": "MO"
        },
        {
          "name": "Montana",
          "abbreviation": "MT"
        },
        {
          "name": "Nebraska",
          "abbreviation": "NE"
        },
        {
          "name": "Nevada",
          "abbreviation": "NV"
        },
        {
          "name": "New Hampshire",
          "abbreviation": "NH"
        },
        {
          "name": "New Jersey",
          "abbreviation": "NJ"
        },
        {
          "name": "New Mexico",
          "abbreviation": "NM"
        },
        {
          "name": "New York",
          "abbreviation": "NY"
        },
        {
          "name": "North Carolina",
          "abbreviation": "NC"
        },
        {
          "name": "North Dakota",
          "abbreviation": "ND"
        },
        {
          "name": "Northern Mariana Islands",
          "abbreviation": "MP"
        },
        {
          "name": "Ohio",
          "abbreviation": "OH"
        },
        {
          "name": "Oklahoma",
          "abbreviation": "OK"
        },
        {
          "name": "Oregon",
          "abbreviation": "OR"
        },
        {
          "name": "Palau",
          "abbreviation": "PW"
        },
        {
          "name": "Pennsylvania",
          "abbreviation": "PA"
        },
        {
          "name": "Puerto Rico",
          "abbreviation": "PR"
        },
        {
          "name": "Rhode Island",
          "abbreviation": "RI"
        },
        {
          "name": "South Carolina",
          "abbreviation": "SC"
        },
        {
          "name": "South Dakota",
          "abbreviation": "SD"
        },
        {
          "name": "Tennessee",
          "abbreviation": "TN"
        },
        {
          "name": "Texas",
          "abbreviation": "TX"
        },
        {
          "name": "Utah",
          "abbreviation": "UT"
        },
        {
          "name": "Vermont",
          "abbreviation": "VT"
        },
        {
          "name": "Virgin Islands",
          "abbreviation": "VI"
        },
        {
          "name": "Virginia",
          "abbreviation": "VA"
        },
        {
          "name": "Washington",
          "abbreviation": "WA"
        },
        {
          "name": "West Virginia",
          "abbreviation": "WV"
        },
        {
          "name": "Wisconsin",
          "abbreviation": "WI"
        },
        {
          "name": "Wyoming",
          "abbreviation": "WY"
        }
    ]
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
            [{ resize: { width: 500 } }],
            { compress: 0.8, format: SaveFormat.PNG }
          );
        return manipResult.uri
    },
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

export const MessageHelper = {
    
    convertMsgFormatDBToUI: async (messages, userA, userB) => {
      const getUserObj = (username) => {
        if (username === userA.username) {
          return {
            _id: username,
            avatar: userA.avatar_url,
            name: `${userA.first_name} ${userA.last_name}`
          }
        } else {
          return {
            _id: username,
            avatar: userB.avatar_url,
            name: `${userB.first_name} ${userB.last_name}`
          }
        }
      }

      return Promise.all(messages.map(async (msg) => {
        let uimsg = {
          _id: msg.id,
          createdAt: msg.created_at,
          type: msg.type,
          user: getUserObj(msg.by_username)
        }

        if (msg.type === 'text') {
          uimsg = {
            ...uimsg,
            text: msg.text
          }
        } else if (msg.type === 'image') {
          uimsg = {
            ...uimsg,
            image: msg.image
          }
        } else if (msg.type === 'location') {
          uimsg = {
            ...uimsg,
            location: msg.location
          }
        } else if (msg.type === 'product') {
          const { productId } = msg
          const product = await db.collection('products').doc(productId).get().then(snapshot => snapshot.data())

          uimsg = {
            ...uimsg,
            product: product
          }
        } 
  
        return uimsg
      }))
    },

    getConvoCards: (conversations, styles={}) => {
			const { currentUser } = useContext(UserContext)
      const navigation = useNavigation()

      return conversations.map((conversation) => {
				const goToChat = () => 
					navigation.navigate('Chat', {
						sendee: conversation.sendee,
						conversation: conversation
					})

				let preview_text = ''
				if (conversation.last_message) {
          if (conversation.last_message.type === 'deleted') {
						preview_text = '[Deleted]'
					} else if (conversation.last_message.type === 'text') {
						preview_text = conversation.last_message.text
					} else if (conversation.last_message.type === 'image') {
            preview_text = '[Photo]'
          } else if (conversation.last_message.type === 'location') {
            preview_text = '[Location]'
          } else if (conversation.last_message.type === 'product') {
            preview_text = '[Product]'
          }
					// process other types here
					const from_curr_user = conversation.last_message.by_username === currentUser.username
					preview_text = (from_curr_user ? 'You: ' : '') + preview_text
				}
				
				return (
          <Card style={[{ margin: 5, backgroundColor: 'white' }, styles]} key={conversation.id} onPress={goToChat}>
              <View style={{ flex: 1, flexDirection: 'row', opacity: conversation.is_archived ? 0.2 : 1 }}>
                  <View style={{ flex: 2, justifyContent: 'center', minWidth: 50 }}>
                      <CachedImage style={{ height: 50, width: 50, borderRadius: 25 }} source={{ uri: conversation.sendee.avatar_url }} />
                  </View>
                  <View style={{ flex: 15, justifyContent: conversation.last_message ? 'space-between' : 'center' }}>
                      <Text numberOfLines={1} category='s1'>{conversation.sendee.username}</Text>
											{conversation.last_message && <Text numberOfLines={1} appearance='hint'>{preview_text}</Text>}
                  </View>
              </View>
          </Card>
      )
			})
    },

    getProductView: (navigation, product) => {
      const windowWidth = Dimensions.get('window').width;

      return (
        <Pressable 
          style={{ width: windowWidth*0.8, minWidth: 100, backgroundColor: 'white', margin: 3, borderRadius: 12, padding: 10, paddingTop: 5 }} 
          key={product.id} 
          onPress={() => navigation.navigate('Product', { id: product.id })}>
            <Text style={{ marginBottom: 5, textAlign: 'center', fontSize: 12, fontWeight: '400' }}>Mentioned a Product</Text>
            <Divider />
            <View style={{ marginTop: 5, flex: 1, flexDirection: 'row' }}>
                <View style={{ flex: 2, justifyContent: 'center' }}>
                    <CachedImage style={{ width: 100, height: 100 }} source={{ uri: product.thumbnail_urls[0] }} />
                </View>
                <View style={{ flex: 3, justifyContent: 'space-between' }}>
                    <Text><Text category='s1'>Name: </Text>{product.name}</Text>
                    <Text><Text category='s1'>Price: </Text>${product.price}</Text>
                    <Text><FontAwesome name="heart" size={10} color="black" /> {product.favorited_count}</Text>
                </View>
            </View>
        </Pressable>
      )
    }
}
