import { useNavigation } from "@react-navigation/core";
import { firebaseStorage } from "../firebase";
import React from 'react';
import { Card, Text } from "@ui-kitten/components";
import { Image, View } from "react-native";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { FontAwesome } from '@expo/vector-icons';
import CachedImage from "../components/CachedImage";

export const ProductHelper = {
    getProductCardsLong: (products, styles={}) => {
        const navigation = useNavigation()

        return products.map((product) => (
            <Card style={[{ margin: 5 }, styles]} key={product.id} onPress={() => navigation.navigate('Product', { id: product.id })}>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                    <View style={{ flex: 2, justifyContent: 'center' }}>
                        <CachedImage style={{ width: 100, height: 100 }} source={{ uri: product.thumbnail_urls[0] }} />
                    </View>
                    <View style={{ flex: 3, justifyContent: 'space-between' }}>
                        <Text><Text category='s1'>Name: </Text>{product.name}</Text>
                        <Text><Text category='s1'>Price: </Text>${GeneralHelper.numberWithCommas(product.price)}</Text>
                        <Text><FontAwesome name="heart" size={10} color="black" /> {product.favorited_by.length}</Text>
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
            [{ resize: { height: 500, width: 500 } }],
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
