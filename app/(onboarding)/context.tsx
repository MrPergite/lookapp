import { createContext, useContext, useReducer, Dispatch } from "react";

// Define types for the context
export interface OnboardingState {
    payload: {
        gender: string | null;
        clothing_size: string | null;
        shoe_size: string | null;
        shoe_unit: string | null;
        country: string | null;
        pref_avatar_url: string | null;
    }
}

export interface OnboardingAction {
    type: string;
    payload: {
        key: string;
        value: any;
    };
}

export interface OnboardingContextType extends OnboardingState {
    dispatch: Dispatch<OnboardingAction>;
}

// Create context with proper typing
export const OnBoardingContext = createContext<OnboardingContextType>({
    payload: {
        "gender": null,
        "clothing_size": null,
        "shoe_size": null,
        "shoe_unit": null,
        "country": null,
        "pref_avatar_url": null,
    },
    dispatch: () => null
});

export const onBoardingReducer = (state: OnboardingState, action: OnboardingAction) => {
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
    const [state, dispatch] = useReducer(onBoardingReducer, {
        payload: {
            "gender": null,
            "clothing_size": null,
            "shoe_size": null,
            "shoe_unit": null,
            "country": null,
            "pref_avatar_url": null,
        }
    });
    
    return (
        <OnBoardingContext.Provider value={{ ...state, dispatch }} >
            {children}
        </OnBoardingContext.Provider>
    )
}