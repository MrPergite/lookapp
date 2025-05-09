import { createContext, useContext, useReducer, Dispatch } from "react";

// Define types for the context
export interface OnboardingPayload {
    gender: string | null;
    clothing_size: string | null;
    shoe_size: string | null;
    shoe_unit: string | null;
    country: string | null;
    pref_avatar_url: string | null;
    avatarPath?: string | null;
    sizes: any | null;
    avatar: any | null;
    styleProfileState?: StyleProfileDataType | null;
}

// Define a type for the data managed by StyleProfile component
export interface StyleProfileDataType {
  images: string[];
  processingStatus: Record<number, string>;
  rejectionReasons: Record<number, string>;
  progressValue: number;
  avatarStatus: string;
  avatarGenerationStartTime: number | null;
}

export interface OnboardingState {
    payload: OnboardingPayload;
}

// Define specific action types
export type OnboardingActionType = 'SET_PAYLOAD'; // Add other action types here if any, e.g., | 'RESET_STATE'

export interface OnboardingAction {
    type: OnboardingActionType; // Use the specific action type(s)
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
        avatarPath: null,
        sizes: null,
        avatar: null,
        styleProfileState: null,
    },
    dispatch: () => null
});

export const onBoardingReducer = (state: OnboardingState, action: OnboardingAction): OnboardingState => { // Add explicit return type
    const { type, payload: actionPayload } = action; // Renamed action.payload for clarity within reducer scope
    switch (type) {
        case "SET_PAYLOAD":
            return {
                ...state,
                payload: {
                    ...state.payload,
                    [actionPayload.key]: actionPayload.value
                }
            };
        default:
            // If the action type isn't matched, return the original state
            // to avoid unnecessary re-renders.
            return state;
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
            avatarPath: null,
            sizes: null,
            avatar: null,
            styleProfileState: null,
        }
    });
    
    return (
        <OnBoardingContext.Provider value={{ ...state, dispatch }} >
            {children}
        </OnBoardingContext.Provider>
    )
}