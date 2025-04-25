import React, { useState } from 'react'
import * as Location from 'expo-location';

function useGPSLocstion() {
    const [userGPSLocation, setUserGPSLocation] = useState<{ country: string, city: string } | null>(null);

    const getLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.log('Permission denied');
            return userGPSLocation;
        }

        const location = await Location.getCurrentPositionAsync({});
        const [place] = await Location.reverseGeocodeAsync(location.coords);

        console.log('Country:', place.country);
        console.log('City:', place.city);
        if (place.country && place.city) {
            setUserGPSLocation({ country: place.country, city: place.city });
        }

    }

    return { userGPSLocation, getLocation } as const;
}

export default useGPSLocstion;
