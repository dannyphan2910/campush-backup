import { USERS } from "./users";

export const PRODUCTS = [
    {
        id: 1,
        name: "Black Mirror",
        thumbnail: "https://www.ikea.com/us/en/images/products/nissedal-mirror-black__0637805_pe698601_s5.jpg",
        favorite_count: 43,
        seller: USERS[4],
        price: undefined,
    },
    {
        id: 2,
        name: "White Table",
        thumbnail: "https://www.ikea.com/us/en/images/products/linnmon-adils-table-white__0737165_pe740925_s5.jpg",
        favorite_count: 34,
        seller: USERS[0],
        price: undefined,
    },
    {
        id: 3,
        name: "Black Armchair",
        thumbnail: "https://www.ikea.com/us/en/images/products/koarp-armchair-saxemara-black-blue-black__0949810_pe800027_s5.jpg?f=s",
        favorite_count: 5,
        seller: USERS[1],
        price: undefined,
    },
    {
        id: 4,
        name: "Mattress",
        thumbnail: "https://i1.adis.ws/i/hmk/134259_ALT01?h=500&w=598&sm=CM",
        favorite_count: 10,
        seller: USERS[4],
        price: undefined,
    },
    {
        id: 5,
        name: "Topper",
        thumbnail: "https://target.scene7.com/is/image/Target/GUEST_71b799dd-a4fc-4e2e-9f0d-5df7e4e2995d?wid=488&hei=488&fmt=pjpeg",
        favorite_count: 2,
        seller: USERS[3],
        price: undefined,
    },
    {
        id: 6,
        name: "Microwave",
        thumbnail: "https://images.costco-static.com/ImageDelivery/imageService?profileId=12026540&itemId=1325470-847&recipeName=680",
        favorite_count: 43,
        seller: USERS[2],
        price: undefined,
    },
    {
        id: 7,
        name: "White Mini Fridge",
        thumbnail: "https://mobileimages.lowes.com/productimages/92e8f888-ef51-48f8-a63e-0ec59761ba97/05369330.jpg?size=pdhi",
        favorite_count: 43,
        seller: USERS[4],
        price: undefined,
    },
    {
        id: 8,
        name: "Water Bottle",
        thumbnail: "https://d34kame2p3gj5k.cloudfront.net/media/uploads/2018/09/05155415/ocean-blue-17oz-SWB-BLUE02.jpg",
        favorite_count: 43,
        seller: USERS[0],
        price: undefined,
    },
    {
        id: 9,
        name: "White Mirror",
        thumbnail: "https://www.ikea.com/us/en/images/products/nissedal-mirror-white__0637799_pe698595_s5.jpg?f=s",
        favorite_count: 43,
        seller: USERS[5],
        size: undefined,
    }
];

export const FEATURED_PRODUCTS = PRODUCTS.slice(0, 5);
export const POPULAR_PRODUCTS = PRODUCTS.slice(5, 9);

