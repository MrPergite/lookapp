import axios from 'axios';
import { useState } from 'react';
import { useEffect } from 'react';
import { countries } from "countries-list"

/**
 * Fetches the current user's IP-based location data
 * @returns The user's country name
 */
export const fetchUserCountry = async (): Promise<string> => {
    try {
        const response = await axios.get('https://ipwho.is/');
        return response.data.country;
    } catch (error) {
        console.error('Error fetching user country:', error);
        return '';
    }
};

/**
 * Fetches all countries from the REST Countries API
 * @returns Array of country names
 */
export const fetchAllCountries = (): { label: string, value: string }[] => {
    const countriesList = Object.values(countries).map((country) => ({
        label: country.name,
        value: country.name
    }));

    return countriesList;
};

export type CountryData = {
    userCountry: string;
    countries: { label: string, value: string }[];
}

/**
* Gets both the current user's country and the list of all countries
* @returns Object containing the user's country and a list of all countries
*/
const getCountryData = async (): Promise<CountryData> => {
    try {
        // Fetch both data sources in parallel for better performance
        const [userCountry, countries] = await Promise.all([
            fetchUserCountry(),
            fetchAllCountries()
        ]);

        return {
            userCountry,
            countries
        } as const;
    } catch (error) {
        console.error('Error fetching country data:', error);
        return {
            userCountry: '',
            countries: []
        } as const;
    }
};

export const useUserCountry = () => {
    const [userLocation, setUserLocation] = useState<CountryData>({
        userCountry: '',
        countries: []
    });

    useEffect(() => {
        getCountryData().then((details: CountryData) => {
            setUserLocation(details)
        })
    }, [])

    return userLocation;
}