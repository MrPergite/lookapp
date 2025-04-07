import axios from 'axios';
import { useState } from 'react';
import { useEffect } from 'react';

/**
 * Fetches the current user's IP-based location data
 * @returns The user's country name
 */
export const fetchUserCountry = async (): Promise<string> => {
    try {
        const response = await axios.get('https://ipapi.co/json/');
        return response.data.country_name;
    } catch (error) {
        console.error('Error fetching user country:', error);
        return '';
    }
};

/**
 * Fetches all countries from the REST Countries API
 * @returns Array of country names
 */
export const fetchAllCountries = async (): Promise<{ label: string, value: string }[]> => {
    try {
        const response = await axios.get('https://restcountries.com/v3.1/all');

        // Sort countries alphabetically by common name
        const countries = response.data
            .map((country: any) => ({ label: country.name.common, value: country.name.common }))
            .sort((a: any, b: any) => a.value.localeCompare(b.value));

        return countries;
    } catch (error) {
        console.error('Error fetching countries:', error);
        return [];
    }
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