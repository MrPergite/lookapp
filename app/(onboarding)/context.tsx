import { createContext, useContext, useReducer } from "react";


export const OnBoardingContext = createContext({
    payload: {
        "gender": null,
        "clothing_size": null,
        "shoe_size": null,
        "shoe_unit": null,
        "country": null,
        "pref_avatar_url": null,
    }

})

export const onBoardingReducer = (state: Record<string, any>, action: { payload: Record<string, any>; type: string }) => {
    const { type, payload } = action
    switch (type) {
        case "SET_PAYLOAD":
            return { ...state, payload: { ...state.payload, [payload.key]: payload.value } }
        default:
            return { ...state }
    }
}

export const useOnBoarding = () => useContext(OnBoardingContext);



export const OnBoardingProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(onBoardingReducer, {})
    return (
        <OnBoardingContext.Provider value={{ ...state, dispatch }} >
            {children}
        </OnBoardingContext.Provider>

    )
}