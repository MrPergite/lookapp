import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AVATARS, DEFAULT_AVATAR } from "@/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ImageContextType = {
    uploadedImage: any;
    setUploadedImage: (image: any) => void;
    searchText: string;
    setSearchText: (text: string) => void;
    showSearchResults: boolean;
    setSearchResults: (results: any) => void;
    initialSearch: boolean;
    setInitialSearch: (search: boolean) => void;
    showLogin: boolean;
    setShowLogin: (login: boolean) => void;
    redirectionCheck: boolean;
    setRedirectionCheck: (check: boolean) => void;
    selectedGender: string;
    setSelectedGender: (gender: string) => void;
    avatar: any;
    setAvatar: (avatar: any) => void;
    instagramPost: any;
    setInstagramPost: (post: any) => void;
    isAvatarLoading: boolean;
}


const ImageContext = createContext<ImageContextType | {}>({});

export const useImageContext = () => {
    return useContext(ImageContext);
};



export const ImageProvider = ({ children }: { children: React.ReactNode }) => {
    const [uploadedImage, setUploadedImage] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [showSearchResults, setSearchResults] = useState(false);
    const [initialSearch, setInitialSearch] = useState(true);
    const [showLogin, setShowLogin] = useState(true);
    const [redirectionCheck, setRedirectionCheck] = useState(false);
    const [searchType, setSearchType] = useState("");
    const [isDesktopVisible, setIsDesktopVisible] = useState(true);
    const [selectedGender, setSelectedGender] = useState("male");
    const [avatar, setAvatar] = useState<{
        id: string;
        name: string;
        src: string;
        gender: string;
    } | null>(null);

    const fetchAvatar = async () => {
        const gender = await AsyncStorage.getItem("selectedGender") || "female";
        setAvatar(gender === "female" ? DEFAULT_AVATAR : AVATARS[1]);
    };

    useEffect(() => {
        fetchAvatar();
    }, []);

    const [instagramPost, setInstagramPost] = useState({
        url: "",
        images: [],
    });
    return (
        <ImageContext.Provider
            value={{
                uploadedImage,
                setUploadedImage,
                searchText,
                setSearchText,
                showSearchResults,
                setSearchResults,
                initialSearch,
                setInitialSearch,
                showLogin,
                setShowLogin,
                searchType,
                setSearchType,
                isDesktopVisible,
                setIsDesktopVisible,
                setInstagramPost,
                instagramPost,
                redirectionCheck,
                setRedirectionCheck,
                selectedGender,
                setSelectedGender,
                avatar,
                setAvatar,
            }}
        >
            {children}
        </ImageContext.Provider>
    );
};