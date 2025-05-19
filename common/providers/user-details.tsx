import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { fetchUserCountry } from "@/app/(onboarding)/queries";

export type UserDetailsContextType = {
    userCountry: Record<string, any>;
}


const UserDetailsContext = createContext<UserDetailsContextType | {}>({});



const initialState = {
    userCountry: {} as Record<string, any>
}

export const useUserDetails = () => useContext(UserDetailsContext) as UserDetailsContextType;

const userDetailsReducer = (state: typeof initialState, action: any) => {
    switch (action.type) {
        case "SET_USER_COUNTRY":
            return { ...state, userCountry: action.payload };
        default:
            return state;
    }
}

export const UserDetailsProvider = ({ children }: { children: React.ReactNode }) => {

    const [userDetails, dispatch] = useReducer(userDetailsReducer, initialState)


    const fetchUserDetails = async () => {
        const userCountry = await fetchUserCountry();
        dispatch({ type: "SET_USER_COUNTRY", payload: userCountry });
    };

    useEffect(() => {
        fetchUserDetails();
    }, []);


    return (
        <UserDetailsContext.Provider
            value={{
                userCountry: userDetails.userCountry,
                dispatch,

            }}
        >
            {children}
        </UserDetailsContext.Provider>
    );
};