import React from "react";
import { Button, Box, Typography } from "@mui/material";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../features/auth/firebase";
import { useAuthStore } from "../features/auth/store";

export function FirestoreTest() {
  const { user } = useAuthStore();
  const [testResult, setTestResult] = React.useState<string>("");

  const testFirestore = async () => {
    if (!user) {
      setTestResult("No user found");
      return;
    }

    try {
      console.log("Testing Firestore connection...");
      
      // Test 1: Try to add a test document
      const testData = {
        userId: user.uid,
        message: "Test document",
        timestamp: serverTimestamp(),
        testId: Date.now().toString()
      };
      
      console.log("Adding test document:", testData);
      const docRef = await addDoc(collection(db, "test"), testData);
      console.log("Test document added with ID:", docRef.id);
      
      // Test 2: Try to read it back
      const querySnapshot = await getDocs(collection(db, "test"));
      console.log("Test documents found:", querySnapshot.size);
      
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log("Test documents:", docs);
      
      setTestResult(`✅ Firestore test successful! Added document ${docRef.id}, found ${querySnapshot.size} test documents.`);
      
    } catch (error) {
      console.error("Firestore test failed:", error);
      setTestResult(`❌ Firestore test failed: ${error}`);
    }
  };

  const testNotebooks = async () => {
    if (!user) {
      setTestResult("No user found");
      return;
    }

    try {
      console.log("Testing notebooks collection...");
      
      // Test: Try to read notebooks
      const querySnapshot = await getDocs(collection(db, "notebooks"));
      console.log("Notebooks found:", querySnapshot.size);
      
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log("All notebooks:", docs);
      
      // Filter by user
      const userNotebooks = docs.filter(doc => doc.userId === user.uid);
      console.log("User notebooks:", userNotebooks);
      
      setTestResult(`✅ Notebooks test successful! Found ${querySnapshot.size} total notebooks, ${userNotebooks.length} for current user.`);
      
    } catch (error) {
      console.error("Notebooks test failed:", error);
      setTestResult(`❌ Notebooks test failed: ${error}`);
    }
  };

  if (!user) {
    return <Typography>Please log in to test Firestore</Typography>;
  }

  return (
    <Box sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 1, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Firestore Test (Debug)
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        User ID: {user.uid}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button variant="outlined" onClick={testFirestore}>
          Test Firestore Connection
        </Button>
        <Button variant="outlined" onClick={testNotebooks}>
          Test Notebooks Collection
        </Button>
      </Box>
      {testResult && (
        <Typography variant="body2" sx={{ 
          p: 1, 
          backgroundColor: "background.paper", 
          borderRadius: 1,
          fontFamily: "monospace",
          fontSize: "0.75rem"
        }}>
          {testResult}
        </Typography>
      )}
    </Box>
  );
}
