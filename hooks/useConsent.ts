import { useEffect, useState } from 'react';
import {
    AdsConsent,
    // AdsConsentDebugGeography,
    AdsConsentInfoOptions,
    AdsConsentStatus,
    AdsConsentInfo,
} from 'react-native-google-mobile-ads';
import {db} from "@/firebase";
import auth from "@react-native-firebase/auth";

export function useConsent() {
    const [personalizedAds, setPersonalizedAds] = useState<boolean|null>(null);
    const user = auth().currentUser;

    useEffect(() => {
        async function initConsent() {
            if (!user) return
            try {
                const options: AdsConsentInfoOptions = {
                    tagForUnderAgeOfConsent: false,
                };

                const info: AdsConsentInfo = await AdsConsent.requestInfoUpdate(options);
                if (info.status === AdsConsentStatus.OBTAINED) {
                    await db.collection('users').doc(user.uid).update({ personalizedAds: true });
                }


                if (
                    info.status === AdsConsentStatus.REQUIRED &&
                    info.isConsentFormAvailable
                ) {
                    await AdsConsent.showForm();
                    const newInfo = await AdsConsent.requestInfoUpdate();
                    setPersonalizedAds(newInfo.status === AdsConsentStatus.OBTAINED);
                } else {
                    setPersonalizedAds(info.status === AdsConsentStatus.OBTAINED);
                }
            } catch (e) {
                console.warn('Consent flow error, defaulting to non-personalized ads', e);
                setPersonalizedAds(false);
            }
        }

        initConsent().catch((err) => {
            console.error(err);
        });
    }, []);

    return personalizedAds;
}
