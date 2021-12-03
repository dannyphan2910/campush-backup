import { db, firebaseStorage } from "../firebase";

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