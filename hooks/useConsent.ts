// hooks/useConsent.ts
import { useEffect, useState } from 'react';
import {
    AdsConsent,
    AdsConsentDebugGeography,
    AdsConsentInfoOptions,
    AdsConsentStatus,
    AdsConsentInfo,
} from 'react-native-google-mobile-ads';
import {db} from "@/firebase";
import auth from "@react-native-firebase/auth";

export function useConsent() {
    // null = loading, true = personalized OK, false = non-personalized only
    const [personalizedAds, setPersonalizedAds] = useState<boolean|null>(null);
    const user = auth().currentUser;

    useEffect(() => {
        async function initConsent() {
            if (!user) return
            try {
                // 1) Build your debug/testing options (remove or comment out in prod):
                const options: AdsConsentInfoOptions = {
                    debugGeography: AdsConsentDebugGeography.EEA,   // force EEA for testing
                    testDeviceIdentifiers: ['EMULATOR'],            // your device’s ID or 'EMULATOR'
                    tagForUnderAgeOfConsent: false,
                };

                // 2) Ask the SDK for consent info:
                const info: AdsConsentInfo = await AdsConsent.requestInfoUpdate(options);
                if (info.status === AdsConsentStatus.OBTAINED) {
                    await db().collection('users').doc(user.uid).update({ personalizedAds: true });
                }


                // 3) If consent *might* be required AND a form is available, show it:
                if (
                    info.status === AdsConsentStatus.REQUIRED &&
                    info.isConsentFormAvailable
                ) {
                    await AdsConsent.showForm();                     // Google’s built-in form
                    // Re-fetch status after they close it:
                    const newInfo = await AdsConsent.requestInfoUpdate();
                    setPersonalizedAds(newInfo.status === AdsConsentStatus.OBTAINED);
                } else {
                    // Either not required, or already granted/denied:
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
