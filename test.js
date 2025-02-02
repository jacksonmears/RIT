// TestScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { auth, db } from './firebase';  // Make sure this path matches your firebase.js location
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const TestScreen = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firestoreData, setFirestoreData] = useState(null);

  useEffect(() => {
    // Sign in anonymously
    signInAnonymously(auth)
      .then(() => {
        setUser(auth.currentUser);
        console.log('Signed in anonymously');
        fetchFirestoreData();  // Fetch data from Firestore
      })
      .catch((error) => {
        console.error('Error signing in anonymously:', error);
      });
  }, []);

  // Fetch data from Firestore
  const fetchFirestoreData = async () => {
    const docRef = doc(db, 'testCollection', 'testDoc'); // Change 'testCollection' and 'testDoc' as needed
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setFirestoreData(docSnap.data());
    } else {
      console.log('No such document!');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome, {user ? user.uid : 'Guest'}!</Text>

      {firestoreData ? (
        <Text>Firestore Data: {JSON.stringify(firestoreData)}</Text>
      ) : (
        <Text>No data found in Firestore</Text>
      )}

      <Button
        title="Sign Out"
        onPress={() => {
          auth.signOut();
          setUser(null);
        }}
      />
    </View>
  );
};

export default TestScreen;
