import React, { useEffect, useState } from 'react'
import { Text, View, SafeAreaView, StyleSheet } from 'react-native';
import SimpleHeader from './SimpleHeader';
import { responsiveFontSize } from '@/utils';
import { MotiView } from 'moti';
import { useAuth, useUser } from '@clerk/clerk-expo';
import AvatarSection from './AvatarSection';
import TabSection from './TabSection';

function VirtualTryOn() {
    const { isSignedIn } = useAuth();
    const { user, isLoaded: isUserLoaded } = useUser();

    const [activeTab, setActiveTab] = useState('shopping-list');
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState({
        name: 'Avatar 1',
        src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Model_photoshoot_of_a_blonde_white_girl_She_wears_20241225115154_cleanup.jpg-pJFQidKcuUmAQIfm0J2t3JufFwk6CW.png",
    });

    const [avatarStatusFromUser, setAvatarStatusFromUser] = useState<AvatarStatus>('pending');
    const [avatarProgressFromUser, setAvatarProgressFromUser] = useState(0);

    useEffect(() => {
        if (isUserLoaded && user && user.publicMetadata) {
            const status = user.publicMetadata.avatar_creation_status as AvatarStatus;
            const progress = user.publicMetadata.avatar_creation_progress as number | undefined;
            
            setAvatarStatusFromUser(status || 'ready');
            if (typeof progress === 'number') {
                setAvatarProgressFromUser(progress);
            }
        } else if (isUserLoaded && !user) {
            setAvatarStatusFromUser('ready');
        }
    }, [user, isUserLoaded]);

    const handleShowMyAvatars = () => { console.log("Show My Avatars clicked"); /* Navigate or show modal */ };
    const handleRecreateAvatar = () => { console.log("Recreate Avatar clicked"); /* API call or navigation */ };

    return (
        <SafeAreaView style={styles.areaContainer} className='w-full' >
            <View style={styles.container} className='lg:hidden flex flex-col h-full' >
                <SimpleHeader title="Virtual Try-On" />
                <View className="flex-1 flex flex-col">
                    <View style={styles.imageContainer}>
                        <MotiView
                            animate={{
                                opacity: isExpanded ? 0.3 : 1,
                                scale: isExpanded ? 0.95 : 1
                            }}
                            transition={{ duration: 0.3 }}
                            className={`${!isSignedIn ? "relative" : ""}`}
                        >
                            <AvatarSection
                                selectedAvatar={selectedAvatar}
                                onAvatarSelect={() => { }}
                                onSaveOutfit={() => { }}
                                setIsFullscreen={() => { }}
                                isExpanded={isExpanded}
                                credits={0}
                                tryonImages={null}
                                onResetAvatar={() => { }}
                                originalAvatar={null}
                                isAvatarLoading={false}
                                isLoadingPrefAvatar={false}
                                isFromSavedOutfit={false}
                                avatarStatus={avatarStatusFromUser}
                                avatarCreationProgress={avatarProgressFromUser}
                                onShowMyAvatars={handleShowMyAvatars}
                                onRecreateAvatar={handleRecreateAvatar}
                            />
                        </MotiView>
                    </View>
                    
                    <TabSection 
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
    },
    areaContainer: {
        flexDirection: 'column',
        flex: 1,
        width: '100%',
    },
    imageContainer: {
        height: '70%',
    }
})

export default VirtualTryOn;

